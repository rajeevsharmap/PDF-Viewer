let pdfDoc = null;
let pageNum = 1;
let currentVisiblePage = 1;
let  scale = 1;
let pages = [];
let target;
let filename = null;

const viewerContainer = document.querySelector('.viewerContainer');
const viewer = document.querySelector('.viewer');

//Setting different thread for file render [to avoid UI/UX blockage]
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

//initial Page Loader
async function renderPage(num, container) {

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.classList.add('pdf-render');
    const ctx = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    container.innerHTML = "";
    container.appendChild(canvas);

    await page.render({
        canvasContext: ctx,
        viewport
    }).promise;
}

async function loadPDF(arrayBuffer) {
    try {
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        document.querySelector('.fileName').textContent = filename;
        document.querySelector('.page-total').textContent = pdfDoc.numPages;
        document.querySelector('.input-window').classList.add('hide');
        document.querySelector('.pdf-previewer').classList.add('show');

        viewer.innerHTML = '';
        pages.length = 0;

        // ✅ Now await works properly
        const firstPage = await pdfDoc.getPage(1);
        const baseViewport = firstPage.getViewport({ scale: 1 });
        scale = Math.min(800, viewerContainer.clientWidth - 32) / baseViewport.width; // ← computed once
        const viewport = firstPage.getViewport({ scale });

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.dataset.pageNumber = i;

            pageDiv.style.height = `${viewport.height}px`;

            viewer.appendChild(pageDiv);

            pages.push({
                pageNumber: i,
                rendered: false,
                div: pageDiv
            });
        }

        initObserver();

    } catch (err) {
        console.error('PDF load error:', err);
        alert('Could not read this PDF.');
    }
}

function initObserver() {
    observer = new IntersectionObserver(entries => {
        let maxRatio = 0;
        for (const entry of entries) {
            
            const pageDiv = entry.target;
            const pageNumber = parseInt(pageDiv.dataset.pageNumber);
            const pagesObj = pages[pageNumber - 1];
            if (!pagesObj) return;

            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                currentVisiblePage = parseInt(entry.target.dataset.pageNumber);
                document.querySelector('.num-page').textContent = currentVisiblePage;
                pageNum = currentVisiblePage;
            }
            
            if (entry.isIntersecting) {
                if (!pagesObj.rendered) {
                    renderPage(pageNumber, pageDiv);
                    pagesObj.rendered = true;
                }
            } else {
                const buffer = 1;
                if (Math.abs(pageNumber - currentVisiblePage) > buffer) {
                    if (pagesObj.rendered) {
                        pageDiv.innerHTML = '';
                        pagesObj.rendered = false;
                    }
                }
            }
        }
    }, {
        root: viewerContainer,
        threshold: 0.025
    });

    pages.forEach(p => observer.observe(p.div));

}

//User File input through Local browser Window.
const fileInput = document.getElementById('file-input');
document.querySelector('.open-btn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    filename = file.name;
    if (!file) return;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.addEventListener('load', e => loadPDF(e.target.result));
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
    target = document.querySelector(`[data-page-number = "${pageNum}"]`);
    target.scrollIntoView({ behavior: 'smooth' });
}

//Render Next Page
document.querySelector('.nxt-page').addEventListener('click', showNxtPage);

function showNxtPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    target = document.querySelector(`[data-page-number = "${pageNum}"]`);
    target.scrollIntoView({ behavior: 'smooth' });
}

document.querySelector('.toggleBack').addEventListener('click', () => {
    
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    document.querySelector('.input-window').classList.remove('hide');
    document.querySelector('.pdf-previewer').classList.remove('show');

    viewer.innerHTML = '';

    pdfDoc = null;
    pageNum = 1;
    currentVisiblePage = 1;
    target = null;
    scale = 1.5;
    pages = [];
    filename = null;

    document.querySelector('.num-page').textContent = '';
    document.querySelector('.page-total').textContent = '';

    fileInput.value = '';
});