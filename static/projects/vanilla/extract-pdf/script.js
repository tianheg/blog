const input = document.getElementById("pdfinput");
const pdfFrame = document.getElementById("pdfFrame");
const rangeSelector = document.getElementById("rangeSelector");
const extractBtn = document.getElementById("extractBtn");

let pdfArrayBuffer;

// Read our file in async/await fashion
function readAsyncFile(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result);
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});
}

// Render the pdf in an Iframe
function renderPdf(arrayBuffer) {
	const tempBlob = new Blob([new Uint8Array(arrayBuffer)], {
		type: "application/pdf",
	});
	const docUrl = URL.createObjectURL(tempBlob);
	pdfFrame.src = docUrl;
}

// Select page range
function range(start, end) {
	let length = end - start + 1;
	return Array.from({ length }, (_, i) => start + i - 1);
}

// Get file from filePicker
input.addEventListener("change", async (e) => {
	const files = e.target.files;
	if (files.length > 0) {
		pdfArrayBuffer = await readAsyncFile(files[0]);
		renderPdf(pdfArrayBuffer);
	}
});

// Start extraction
extractBtn.addEventListener("click", async () => {
	const rawRange = rangeSelector.value;
	const rangeList = rawRange.split("-");
	const pdfSrcDoc = await PDFLib.PDFDocument.load(pdfArrayBuffer);
	const pdfNewDoc = await PDFLib.PDFDocument.create();
	const pages = await pdfNewDoc.copyPages(
		pdfSrcDoc,
		range(Number(rangeList[0]), Number(rangeList[1])),
	);
	pages.forEach((page) => pdfNewDoc.addPage(page));
	const newPdf = await pdfNewDoc.save();
	saveAs(new Blob([newPdf], { type: "application/pdf" }), "extracted.pdf");
});
