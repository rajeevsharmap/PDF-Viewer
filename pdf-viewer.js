// const url= './Soil Based Moisture Irrigation.pdf';

// let pdfDoc= null, pageNum = 1, pageIsRendering = false, pageNumPending = null;
// const scale=1.5 , 
// canvas = document.querySelector('.pdf-render'),
// ctx= canvas.getContext('2d');

// pdfjsLib.GlobalWorkerOptions.workerSrc =
//     'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// function renderPage(num){
//     pageIsRendering=true;

//     pdfDoc.getPage(num).then(page =>{
//         const viewport = page.getViewport({scale});
//         canvas.height=viewport.height;
//         canvas.width=viewport.width;
        
//         const renderCtx = {
//             canvasContext : ctx,
//             viewport
//         }

//         page.render(renderCtx).promise.then(()=>{
//             pageIsRendering=false;
//             if(pageNumPending !== null){
//             renderPage(pageNumPending);
//             pageNumPending=null;
//         }
//         });
//         document.querySelector('.num-page').textContent = num ;   
//     }); 
// };

// const queueRenderPage = num =>{
//     if(pageIsRendering){
//         pageNumPending= num;
//     } else{
//         renderPage(num);
//     }
// };

// function showPrevPage(){
//     if(pageNum<=1){
//         return;
//     } pageNum--;
//     queueRenderPage(pageNum)
// }

// function showNxtPage(){
//     if(pageNum>= pdfDoc.numPages){
//         return;
//     } pageNum++;
//     queueRenderPage(pageNum)
// }

// pdfjsLib.getDocument(url).promise.then(pdfDoc_ =>{
//     pdfDoc=pdfDoc_ ;
//     document.querySelector('.page-total').textContent = pdfDoc.numPages;
//     renderPage(pageNum);
// });

// document.querySelector('.prev-page').addEventListener('click', showPrevPage);
// document.querySelector('.nxt-page').addEventListener('click', showNxtPage);

// // In JS — no createElement needed
// const fileInput = document.getElementById('file-input');
// document.querySelector('.open-btn').addEventListener('click', () => fileInput.click());

let pdfDoc          = null;
let pageNum         = 1;
let pageIsRendering = false;
let pageNumPending  = null;

const scale  = 1.5;
const canvas = document.querySelector('.pdf-render');
const ctx    = canvas.getContext('2d');

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Render ─────────────────────────────────────────────────────────────────
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

// ── Queue ──────────────────────────────────────────────────────────────────
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
};

// ── Navigation ─────────────────────────────────────────────────────────────
function showPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

function showNxtPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

document.querySelector('.prev-page').addEventListener('click', showPrevPage);
document.querySelector('.nxt-page').addEventListener('click', showNxtPage);

// ── Load PDF from ArrayBuffer ──────────────────────────────────────────────
function loadPDF(arrayBuffer) {
    pageNum = 1;
    pdfjsLib.getDocument({ data: arrayBuffer }).promise
        .then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            document.querySelector('.page-total').textContent = pdfDoc.numPages;
            document.querySelector('.input-window').style.display  = 'none';
            document.querySelector('.pdf-previewer').style.display = 'block';
            renderPage(pageNum);
        })
        .catch(err => {
            console.error('PDF load error:', err);
            alert('Could not read this PDF.');
        });
}

// ── File input ─────────────────────────────────────────────────────────────
const fileInput = document.getElementById('file-input');

// ✅ Fix 1: '.file-input' matches the button class in your HTML
document.querySelector('.open-btn').addEventListener('click', () => fileInput.click());

// ✅ Fix 2: actually handle the file the user picks — was missing entirely
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', e => loadPDF(e.target.result));
    reader.readAsArrayBuffer(file);
});

// ── Drag and drop ──────────────────────────────────────────────────────────
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