let pdfDoc          = null;
let pageNum         = 1;
let pageIsRendering = false;
let pageNumPending  = null;

const scale  = 1.5;
const canvas = document.querySelector('.pdf-render');
const ctx    = canvas.getContext('2d');

//Setting different thread for file render [to avoid UI/UX blockage]
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

//initial Page Loader
function renderPage(num) {
    pageIsRendering = true;

    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale });
        canvas.height  = viewport.height;
        canvas.width   = viewport.width;

        const renderCtx = { canvasContext: ctx, viewport };

        page.render(renderCtx).promise.then(() => {
            pageIsRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        document.querySelector('.num-page').textContent = num;
    });
}

function loadPDF(arrayBuffer) {
    pageNum = 1;
    pdfjsLib.getDocument({ data: arrayBuffer }).promise
        .then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            document.querySelector('.page-total').textContent = pdfDoc.numPages;
            const inputWindow = document.querySelector('.input-window');
            const previewer   = document.querySelector('.pdf-previewer');
            inputWindow.classList.add('hide');
            previewer.classList.add('show');
            renderPage(pageNum);
        })
        .catch(err => {
            console.error('PDF load error:', err);
            alert('Could not read this PDF.');
        });
}

//User File input through Local browser Window.
const fileInput = document.getElementById('file-input');
document.querySelector('.open-btn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', e => loadPDF(e.target.result));
    reader.readAsArrayBuffer(file);
});

//User file input 2.drag and drop 
const dropZone = document.querySelector('.input-file');
dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file || file.type !== 'application/pdf') {
        alert('Please drop a valid PDF file.');
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', e => loadPDF(e.target.result));
    reader.readAsArrayBuffer(file);
});

// Render Previous Page
document.querySelector('.prev-page').addEventListener('click', showPrevPage);

function showPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

//Render Next Page
document.querySelector('.nxt-page').addEventListener('click', showNxtPage);

function showNxtPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

//If no page rendering, then render the specific page 
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
};