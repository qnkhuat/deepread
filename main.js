var url = "https://arxiv.org/pdf/1706.03762";
var {pdfjsLib} = globalThis;
//// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

var loadingTask = pdfjsLib.getDocument(url);
loadingTask.promise.then(function (pdf) {
  console.log("PDF loaded");
  
  // Get total pages
  const numPages = pdf.numPages;
  const container = document.getElementById('pdf-container'); // Add a container div in your HTML
  
  // Render all pages
  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    pdf.getPage(pageNumber).then(function (page) {
      console.log(`Page ${pageNumber} loaded`);

      var scale = 1.5;
      var viewport = page.getViewport({scale: scale});

      // Create a new canvas for each page
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Add canvas to container
      container.appendChild(canvas);

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      var renderTask = page.render(renderContext);
      renderTask.promise.then(function () {
        console.log(`Page ${pageNumber} rendered`);
      });
    });
  }
});
//
//// Listen for HTMX after-request event
//document.body.addEventListener('htmx:afterRequest', function(evt) {
//    if (evt.detail.successful) {
//        document.body.classList.add('viewer-active');
//        initPdfViewer(evt.detail.xhr.response);
//    }
//});
//
//async function initPdfViewer(pdfUrl) {
//    try {
//        const loadingTask = pdfjsLib.getDocument(pdfUrl);
//        const pdf = await loadingTask.promise;
//
//        // Load the first page
//        const page = await pdf.getPage(1);
//        const scale = 1.5;
//        const viewport = page.getViewport({ scale });
//
//        // Prepare canvas for rendering
//        const canvas = document.createElement('canvas');
//        const context = canvas.getContext('2d');
//        canvas.height = viewport.height;
//        canvas.width = viewport.width;
//
//        // Render PDF page on canvas
//        const renderContext = {
//            canvasContext: context,
//            viewport: viewport
//        };
//
//        await page.render(renderContext);
//
//        // Add canvas to viewer
//        const viewer = document.getElementById('pdf-viewer');
//        viewer.innerHTML = '';
//        viewer.appendChild(canvas);
//    } catch (error) {
//        console.error('Error loading PDF:', error);
//    }
//}
//
