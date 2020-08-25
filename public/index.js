// const handleImageUpload = event => {
//   const files = event.target.files
//   const formData = new FormData()
//   formData.append('myFile', files[0])

//   fetch('/saveImage', {
//     method: 'POST',
//     body: formData
//   })
//   .then(response => response.json())
//   .then(data => {
//     console.log(data.path)
//   })
//   .catch(error => {
//     console.error(error)
//   })
// }

let renderStart,
  renderEnd,
  uploadingStart,
  uplodingEnd = null;

const pages = [];
const heights = [];
let width = 0;
let height = 0;
let currentPage = 1;
var scale = 1;

function getCanvasBlob(canvas) {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      // console.log(blob);
      resolve(blob);
    });
  });
}

function convertCanvasToImage(canvas) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      image.src = canvas.toDataURL("image/png");
      resolve(image);
    };
  });
}

async function draw(canvas, ctx, pageNo) {
  const uploads = [];
  const canvas2BlobPromises = [];
  const imageData = await ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(imageData, 0, canvas.height * pageNo);
  // console.log(1);
  // document.body.appendChild(canvas);
  const canvasBlob = await getCanvasBlob(canvas);
  // await convertCanvasToImage(canvas);

  await uploadPromise(canvasBlob, pageNo);
  const downloadLink = document.createElement("a");
  const newImg = document.createElement("img");
  const url = await URL.createObjectURL(canvasBlob);
  newImg.src = url;
  downloadLink.href = `http://localhost:8000/images/${pageNo}.png`;
  downloadLink.innerText = "Server Link";
  // downloadLink.setAttribute("download", "");
  document.body.appendChild(newImg);
  // document.body.appendChild(document.createElement("p"));
  document.body.appendChild(downloadLink);
}

function uploadPromise(blob, i) {
  const imgFile = new File([blob], i);
  const formData = new FormData();
  formData.append("image", imgFile);
  return new Promise((resolve, reject) => {
    fetch("http://localhost:8000/uploadImage", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        resolve();
      })
      .catch((error) => {
        console.error(error);
        reject();
      });
  });
}

async function getPage(pdf) {
  const header = document.createElement("h4");
  document.body.appendChild(header);
  const cavasPromises = [];
  uploadingStart = performance.now();
  for (let i = 1; i <= pdf.numPages; i++) {
    cavasPromises.push(pdfToCanvas(pdf, i));
  }
  renderStart = performance.now();
  await Promise.all(cavasPromises);
  uplodingEnd = performance.now();
  header.innerText =
    `Total time: ` + (uplodingEnd - uploadingStart) / 1000 + " seconds";
  // pdf.getPage(1).then(function (page) {
  //   var viewport = page.getViewport({ scale, dontFlip: false });
  //   var canvas = document.createElement("canvas"),
  //     ctx = canvas.getContext("2d");
  //   var renderContext = { canvasContext: ctx, viewport: viewport };

  //   canvas.height = viewport.height;
  //   canvas.width = viewport.width;
  //   // canvas.height = 300;
  //   // canvas.width = 300;
  //   console.log(viewport, page);
  //   page.render(renderContext).promise.then(function () {
  //     pages.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

  //     heights.push(height);
  //     height += canvas.height;
  //     if (width < canvas.width) width = canvas.width;

  //     if (currentPage < pdf.numPages) {
  //       currentPage++;
  //       getPage(pdf);
  //     } else {
  //       draw();
  //     }
  //   });
  // });
}
async function pdfToCanvas(pdf, pageNo) {
  const canvas2BlobPromises = [];
  const page = await pdf.getPage(pageNo);
  var viewport = page.getViewport({ scale, dontFlip: false });
  const canvas = document.createElement("canvas");
  const ctx = await canvas.getContext("2d");
  const renderContext = { canvasContext: ctx, viewport: viewport };
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render(renderContext).promise;
  await draw(canvas, ctx, pageNo);
  // document.body.appendChild(canvas);

  // pages.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  // heights.push(height);
  // height += canvas.height;
  // if (width < canvas.width) width = canvas.width;
  // await draw();
}

function handleUpload(event) {
  const file = event.target.files[0];
  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(file);
  fileReader.onload = () => {
    const typedArray = new Uint8Array(fileReader.result);
    // console.log(typedArray);
    pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
      getPage(pdf);
    });
  };
}
const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://mozilla.github.io/pdf.js/build/pdf.worker.js";
document.querySelector("#fileUpload").addEventListener("change", handleUpload);
