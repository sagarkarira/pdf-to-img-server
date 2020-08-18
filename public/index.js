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

const pages = [];
const heights = [];
let width = 0;
let height = 0;
let currentPage = 1;
var scale = 1.5;

function getCanvasBlob(canvas) {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      // console.log(blob);
      resolve(blob);
    });
  });
}

async function draw() {
  const header = document.createElement("h1");
  document.body.appendChild(header);
  header.innerText = "Converting";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  const uploads = [];
  const canvas2BlobPromises = [];

  for (var i = 0; i < pages.length; i++) {
    ctx.putImageData(pages[i], 0, heights[i]);
    canvas2BlobPromises.push(getCanvasBlob(canvas));
  }
  header.innerText = "Iterating";
  let n = 0;
  header.innerText = "Making files";
  const blobArr = await Promise.all(canvas2BlobPromises);
  header.innerText = "Uploading";
  blobArr.map((blob, i) => uploads.push(uploadPromise(blob, i)));
  await Promise.all(uploads);
  header.innerText = "Done uploading";
  console.log("Done uploading all images");
  document.body.appendChild(canvas);
  // blobArr.map((blob) => {
  //   const downloadLink = document.createElement("a");
  //   const newImg = document.createElement("img");
  //   const url = URL.createObjectURL(blob);
  //   newImg.src = url;
  //   downloadLink.href = url;
  //   downloadLink.setAttribute("download", "");
  //   document.body.appendChild(downloadLink);
  //   downloadLink.appendChild(newImg);
  // });

  // console.log(n);
}

function uploadPromise(blob, i) {
  const imgFile = new File([blob], i, { type: blob.type });
  const formData = new FormData();
  formData.append("image", imgFile);
  return new Promise((resolve, reject) => {
    fetch("http://localhost:8000/uploadImage", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        resolve();
      })
      .catch((error) => {
        console.error(error);
        reject();
      });
  });
}

function getPage(pdf) {
  pdf.getPage(currentPage).then(function (page) {
    var viewport = page.getViewport({ scale, dontFlip: false });
    var canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d");
    var renderContext = { canvasContext: ctx, viewport: viewport };

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render(renderContext).promise.then(function () {
      pages.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

      heights.push(height);
      height += canvas.height;
      if (width < canvas.width) width = canvas.width;

      if (currentPage < pdf.numPages) {
        currentPage++;
        getPage(pdf);
      } else {
        draw();
      }
    });
  });
}

function handleUpload(event) {
  const file = event.target.files[0];
  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(file);
  fileReader.onload = () => {
    const typedArray = new Uint8Array(fileReader.result);
    console.log(typedArray);
    pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
      getPage(pdf);
    });
  };
}
const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://mozilla.github.io/pdf.js/build/pdf.worker.js";
document.querySelector("#fileUpload").addEventListener("change", handleUpload);
