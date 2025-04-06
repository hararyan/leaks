// Simulated database for users and documents
const users = JSON.parse(localStorage.getItem("users")) || []
let documents = JSON.parse(localStorage.getItem("documents")) || []
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null
let currentDocumentId = null

// DOM Elements
const loginContainer = document.getElementById("login-container")
const registerContainer = document.getElementById("register-container")
const dashboard = document.getElementById("dashboard")
const loginForm = document.getElementById("login-form")
const registerForm = document.getElementById("register-form")
const registerLink = document.getElementById("register-link")
const loginLink = document.getElementById("login-link")
const userDisplay = document.getElementById("user-display")
const logoutBtn = document.getElementById("logout-btn")
const uploadBtn = document.getElementById("upload-btn")
const uploadModal = document.getElementById("upload-modal")
const uploadForm = document.getElementById("upload-form")
const cancelUpload = document.getElementById("cancel-upload")
const documentsList = document.getElementById("documents-list")
const passwordModal = document.getElementById("password-modal")
const passwordForm = document.getElementById("password-form")
const cancelPassword = document.getElementById("cancel-password")

// Check if user is logged in
function checkAuth() {
  if (currentUser) {
    showDashboard()
  } else {
    showLogin()
  }
}

// Show login page
function showLogin() {
  loginContainer.classList.remove("hidden")
  registerContainer.classList.add("hidden")
  dashboard.classList.add("hidden")
}

// Show register page
function showRegister() {
  loginContainer.classList.add("hidden")
  registerContainer.classList.remove("hidden")
  dashboard.classList.add("hidden")
}

// Show dashboard
function showDashboard() {
  loginContainer.classList.add("hidden")
  registerContainer.classList.add("hidden")
  dashboard.classList.remove("hidden")
  userDisplay.textContent = currentUser.username
  renderDocuments()
}

// Register a new user
function registerUser(username, email, password) {
  // Check if username already exists
  if (users.some((user) => user.username === username)) {
    alert("Username already exists. Please choose another one.")
    return false
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password,
  }

  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))
  return true
}

// Login user
function loginUser(username, password) {
  const user = users.find((user) => user.username === username && user.password === password)
  if (user) {
    currentUser = user
    localStorage.setItem("currentUser", JSON.stringify(user))
    return true
  }
  return false
}

// Logout user
function logoutUser() {
  currentUser = null
  localStorage.removeItem("currentUser")
  showLogin()
}

// Render documents list
function renderDocuments() {
  documentsList.innerHTML = ""

  // Filter documents for current user
  const userDocuments = documents.filter((doc) => doc.userId === currentUser.id)

  if (userDocuments.length === 0) {
    documentsList.innerHTML =
      '<p class="no-documents">No documents uploaded yet. Click "Upload Document" to add your first document.</p>'
    return
  }

  userDocuments.forEach((doc) => {
    const isPdf = doc.fileType === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf")
    const fileTypeIcon = isPdf ? "📄 PDF" : "🖼️ Image"

    const docElement = document.createElement("div")
    docElement.className = "document-card"
    docElement.innerHTML = `
      <h3>${doc.name}</h3>
      <p><span class="file-type">${fileTypeIcon}</span> • Uploaded on ${new Date(doc.uploadDate).toLocaleDateString()}</p>
      <div class="card-actions">
        <button class="btn-primary view-doc" data-id="${doc.id}">
          ${doc.password ? "Access (Password Protected)" : "View Document"}
        </button>
        <button class="btn-secondary delete-doc" data-id="${doc.id}">Delete</button>
      </div>
    `
    documentsList.appendChild(docElement)
  })

  // Add event listeners to view and delete buttons
  document.querySelectorAll(".view-doc").forEach((button) => {
    button.addEventListener("click", function () {
      const docId = this.getAttribute("data-id")
      const doc = documents.find((d) => d.id === docId)

      if (doc.password) {
        // Show password modal
        currentDocumentId = docId
        passwordModal.classList.remove("hidden")
      } else {
        // View document directly
        viewDocument(docId)
      }
    })
  })

  document.querySelectorAll(".delete-doc").forEach((button) => {
    button.addEventListener("click", function () {
      const docId = this.getAttribute("data-id")
      deleteDocument(docId)
    })
  })
}

// Upload a new document
function uploadDocument(name, file, password = "") {
  // Check if the file is a PDF or an image
  const isPdf = file.type === "application/pdf"
  const isImage = file.type.startsWith("image/")

  if (!isPdf && !isImage) {
    alert("Currently only PDF and image files are supported.")
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const newDoc = {
      id: Date.now().toString(),
      userId: currentUser.id,
      name: name,
      data: e.target.result, // This contains the file data as a data URL
      fileType: file.type,
      password: password,
      uploadDate: Date.now(),
    }

    documents.push(newDoc)
    localStorage.setItem("documents", JSON.stringify(documents))
    renderDocuments()
    uploadModal.classList.add("hidden")
  }

  reader.readAsDataURL(file)
}

// View a document
function viewDocument(docId) {
  const doc = documents.find((d) => d.id === docId)
  if (!doc) return

  // Check if the document is a PDF
  const isPdf = doc.name.toLowerCase().endsWith(".pdf") || (doc.data && doc.data.includes("data:application/pdf"))

  if (isPdf) {
    // Open PDF viewer in a new tab
    const newTab = window.open("", "_blank")
    newTab.document.write(`
      <html>
        <head>
          <title>${doc.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              height: 100vh; 
              display: flex; 
              flex-direction: column;
              overflow: hidden;
            }
            .toolbar { 
              background-color: #4f46e5; 
              color: white; 
              padding: 10px; 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              z-index: 10;
            }
            .toolbar h1 { 
              margin: 0; 
              font-size: 1.2rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 50%;
            }
            #pdf-container { 
              flex: 1; 
              overflow: auto; 
              background-color: #525659;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 20px;
            }
            #pdf-viewer { 
              background-color: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
            }
            .controls { 
              display: flex; 
              gap: 10px;
              align-items: center;
              flex-wrap: wrap;
            }
            button { 
              background-color: white; 
              color: #4f46e5; 
              border: none; 
              padding: 5px 10px; 
              border-radius: 4px; 
              cursor: pointer;
              font-weight: 500;
            }
            button:hover { background-color: #f3f4f6; }
            button:disabled { 
              opacity: 0.5; 
              cursor: not-allowed; 
            }
            #page-info { 
              margin-right: 10px;
              white-space: nowrap;
            }
            #fit-width-btn {
              margin-left: 10px;
            }
            @media (max-width: 768px) {
              .toolbar {
                flex-direction: column;
                gap: 10px;
              }
              .toolbar h1 {
                max-width: 100%;
              }
              .controls {
                width: 100%;
                justify-content: center;
              }
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"></script>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          </script>
        </head>
        <body>
          <div class="toolbar">
            <h1>${doc.name}</h1>
            <div class="controls">
              <span id="page-info">Page: 1 / 1</span>
              <button id="prev-page" disabled>Previous</button>
              <button id="next-page" disabled>Next</button>
              <button id="zoom-in">Zoom In</button>
              <button id="zoom-out">Zoom Out</button>
              <button id="fit-width-btn">Fit Width</button>
            </div>
          </div>
          <div id="pdf-container">
            <canvas id="pdf-viewer"></canvas>
          </div>
          
          <script>
            // PDF.js variables
            let pdfDoc = null;
            let pageNum = 1;
            let pageRendering = false;
            let pageNumPending = null;
            let scale = 1.0; // Start with a more reasonable scale
            const canvas = document.getElementById('pdf-viewer');
            const ctx = canvas.getContext('2d');
            
            // Get device pixel ratio for better rendering on high-DPI displays
            const pixelRatio = window.devicePixelRatio || 1;
            
            // Parse the data URL to get the base64 data
            const pdfData = "${doc.data}".split(',')[1];
            
            // Function to handle window resize
            function resizeCanvas() {
              if (pdfDoc) {
                // Re-render the current page when window is resized
                renderPage(pageNum);
              }
            }
            
            // Add resize event listener
            window.addEventListener('resize', resizeCanvas);
            
            // Function to fit PDF to width
            function fitToWidth() {
              if (!pdfDoc) return;
              
              pdfDoc.getPage(pageNum).then(function(page) {
                const viewport = page.getViewport({ scale: 1.0 });
                const containerWidth = document.getElementById('pdf-container').clientWidth - 40; // Subtract padding
                const newScale = containerWidth / viewport.width;
                
                scale = newScale;
                renderPage(pageNum);
              });
            }
            
            // Load the PDF
            pdfjsLib.getDocument({data: atob(pdfData)}).promise.then(function(pdf) {
              pdfDoc = pdf;
              document.getElementById('page-info').textContent = 'Page: ' + pageNum + ' / ' + pdfDoc.numPages;
              
              // Enable/disable buttons based on page count
              document.getElementById('prev-page').disabled = pageNum <= 1;
              document.getElementById('next-page').disabled = pageNum >= pdfDoc.numPages;
              
              // Fit to width initially
              fitToWidth();
              
              // Set up button event listeners
              document.getElementById('prev-page').addEventListener('click', onPrevPage);
              document.getElementById('next-page').addEventListener('click', onNextPage);
              document.getElementById('zoom-in').addEventListener('click', onZoomIn);
              document.getElementById('zoom-out').addEventListener('click', onZoomOut);
              document.getElementById('fit-width-btn').addEventListener('click', fitToWidth);
            }).catch(function(error) {
              console.error('Error loading PDF:', error);
              document.getElementById('pdf-container').innerHTML = '<p style="padding: 20px; color: red; background: white;">Error loading PDF. The file may be corrupted or not a valid PDF.</p>';
            });
            
            // Render the specified page
            function renderPage(num) {
              pageRendering = true;
              
              // Get the page
              pdfDoc.getPage(num).then(function(page) {
                // Adjust canvas size to the page with pixel ratio for sharp rendering
                const viewport = page.getViewport({scale: scale});
                
                // Set canvas dimensions with pixel ratio for sharp rendering
                canvas.height = viewport.height * pixelRatio;
                canvas.width = viewport.width * pixelRatio;
                
                // Set display size
                canvas.style.height = viewport.height + 'px';
                canvas.style.width = viewport.width + 'px';
                
                // Scale context for high-DPI displays
                ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
                
                // Render PDF page into canvas context
                const renderContext = {
                  canvasContext: ctx,
                  viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                // Wait for rendering to finish
                renderTask.promise.then(function() {
                  pageRendering = false;
                  
                  if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                  }
                });
              });
              
              // Update page info
              document.getElementById('page-info').textContent = 'Page: ' + num + ' / ' + pdfDoc.numPages;
              
              // Enable/disable buttons based on current page
              document.getElementById('prev-page').disabled = num <= 1;
              document.getElementById('next-page').disabled = num >= pdfDoc.numPages;
            }
            
            // Functions for page navigation
            function queueRenderPage(num) {
              if (pageRendering) {
                pageNumPending = num;
              } else {
                renderPage(num);
              }
            }
            
            function onPrevPage() {
              if (pageNum <= 1) return;
              pageNum--;
              queueRenderPage(pageNum);
            }
            
            function onNextPage() {
              if (pageNum >= pdfDoc.numPages) return;
              pageNum++;
              queueRenderPage(pageNum);
            }
            
            function onZoomIn() {
              scale *= 1.25;
              queueRenderPage(pageNum);
            }
            
            function onZoomOut() {
              if (scale <= 0.5) return;
              scale /= 1.25;
              queueRenderPage(pageNum);
            }
            
            // Keyboard navigation
            document.addEventListener('keydown', function(e) {
              if (e.key === 'ArrowRight' || e.key === ' ') {
                onNextPage();
              } else if (e.key === 'ArrowLeft') {
                onPrevPage();
              }
            });
          </script>
        </body>
      </html>
    `)
  } else {
    // For non-PDF files, use the existing viewer
    const newTab = window.open()
    newTab.document.write(`
      <html>
        <head>
          <title>${doc.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .document-viewer { max-width: 800px; margin: 0 auto; }
            h1 { color: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="document-viewer">
            <h1>${doc.name}</h1>
            <p>This is a simulated document viewer. In a real application, the actual document would be displayed here.</p>
            <div>
              <img src="${doc.data}" style="max-width: 100%;" />
            </div>
          </div>
        </body>
      </html>
    `)
  }
}

// Delete a document
function deleteDocument(docId) {
  if (confirm("Are you sure you want to delete this document?")) {
    documents = documents.filter((doc) => doc.id !== docId)
    localStorage.setItem("documents", JSON.stringify(documents))
    renderDocuments()
  }
}

// Event Listeners
registerLink.addEventListener("click", (e) => {
  e.preventDefault()
  showRegister()
})

loginLink.addEventListener("click", (e) => {
  e.preventDefault()
  showLogin()
})

loginForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const username = document.getElementById("username").value
  const password = document.getElementById("password").value

  if (loginUser(username, password)) {
    showDashboard()
  } else {
    alert("Invalid username or password")
  }
})

registerForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const username = document.getElementById("reg-username").value
  const email = document.getElementById("reg-email").value
  const password = document.getElementById("reg-password").value
  const confirmPassword = document.getElementById("reg-confirm-password").value

  if (password !== confirmPassword) {
    alert("Passwords do not match")
    return
  }

  if (registerUser(username, email, password)) {
    alert("Registration successful! Please login.")
    showLogin()
  }
})

logoutBtn.addEventListener("click", logoutUser)

uploadBtn.addEventListener("click", () => {
  uploadModal.classList.remove("hidden")
})

cancelUpload.addEventListener("click", () => {
  uploadModal.classList.add("hidden")
})

uploadForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const name = document.getElementById("document-name").value
  const file = document.getElementById("document-file").files[0]
  const password = document.getElementById("document-password").value

  if (!file) {
    alert("Please select a file to upload")
    return
  }

  uploadDocument(name, file, password)
})

passwordForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const password = document.getElementById("doc-password").value
  const doc = documents.find((d) => d.id === currentDocumentId)

  if (doc && doc.password === password) {
    passwordModal.classList.add("hidden")
    viewDocument(currentDocumentId)
  } else {
    alert("Incorrect password")
  }
})

cancelPassword.addEventListener("click", () => {
  passwordModal.classList.add("hidden")
  currentDocumentId = null
})

// Initialize the application
checkAuth()

