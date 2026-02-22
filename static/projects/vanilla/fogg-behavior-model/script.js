function drawLine() {
  const canvas = document.getElementById("fogg");
  const ctx = canvas.getContext("2d");

  // Define the variables
  const maxX = 20;
  const k = 45;

  // Set up the canvas
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.fillStyle = "black";

  // Draw x-axis
  ctx.moveTo(47, canvas.height - 50);
  ctx.lineTo(canvas.width, canvas.height - 50);

  // Draw y-axis
  ctx.moveTo(50, 0);
  ctx.lineTo(50, canvas.height - 50);
  ctx.moveTo(0, 0);
  ctx.stroke();

  // Add label
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Easy to Do", canvas.width - 50, canvas.height - 20);
  ctx.fillText("Hard to Do", 90, canvas.height - 20);
  ctx.fillText("High", 20, 20);
  ctx.fillText("Low", 20, canvas.height - 60);

  ctx.rotate((52 * Math.PI) / 180);
  ctx.fillText("Action Line", 420, -5);
  ctx.rotate((-52 * Math.PI) / 180);

  ctx.fillStyle = "#587d91";
  ctx.font = "700 2rem Arial";
  ctx.fillText("Prompts", 500, 200);
  ctx.fillText("Prompts", 200, 450);
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("succeed here", 500, 230);
  ctx.fillText("failed here", 200, 480);

  ctx.font = "700 3rem Arial";
  ctx.fillStyle = "#0ab3e7";
  ctx.fillText("B = MAP", 600, 100);

  // Define the curve
  ctx.beginPath();

  ctx.strokeStyle = "#587d91";

  for (let x = 1; x <= maxX; x += 0.1) {
    const y = k / x;

    // Draw the curve
    const canvasX = x * 45 + 50;
    const canvasY = canvas.height - 50 - y * 20;
    ctx.lineTo(canvasX, canvasY);
  }

  // Finish drawing the curve
  ctx.stroke();
}

function drawPoint() {
  const canvas = document.getElementById("point");
  const ctx = canvas.getContext("2d");
  let state = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    down: false,
  };
  let draw = function (ctx, canvas, state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#08b3e7";
    ctx.strokeStyle = "#92d2f1";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(state.x, state.y, state.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(state.x, state.y, state.r + 8, 0, Math.PI * 2);
    ctx.stroke();

    // draw horizontal line
    ctx.setLineDash([10, 3]);
    ctx.beginPath();
    ctx.moveTo(state.x - 30, state.y);
    ctx.lineTo(40, state.y);
    ctx.strokeStyle = "#05b2e6";
    ctx.stroke();

    // draw vertical line
    ctx.beginPath();
    ctx.moveTo(state.x, state.y + 30);
    ctx.lineTo(state.x, canvas.height - 35);
    ctx.strokeStyle = "#05b2e6";
    ctx.stroke();

    ctx.font = "30px Arial";
    ctx.rotate((-90 * Math.PI) / 180);
    ctx.fillText("Motivation", -state.y - 90, 30);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.fillText("Ability", state.x - 150, canvas.height - 14);
  };

  canvas.addEventListener("pointerdown", pointerDown(state));
  canvas.addEventListener("pointermove", pointerMove(state));
  canvas.addEventListener("pointerup", pointerUp(state));

  function pointerDown(state) {
    return function (e) {
      var pos = getCanvasRelativePoint(e);
      if (distance(pos, state) < state.r) {
        state.down = true;
      }
    };
  }

  function pointerMove(state) {
    return function (e) {
      if (state.down) {
        var pos = getCanvasRelativePoint(e);
        state.x = pos.x;
        state.y = pos.y;
        draw(ctx, canvas, state);
      }
    };
  }

  function pointerUp(state) {
    return function (e) {
      state.down = false;
    };
  }

  function getCanvasRelativePoint(event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function distance(p1, p2) {
    var dx = p1.x - p2.x,
      dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  draw(ctx, canvas, state);
}

function saveImage() {
  const btn = document.getElementById("saveButton");
  btn.addEventListener("click", () => {
    let downloadLink = document.createElement("a");
    downloadLink.setAttribute("download", "fogg-behavior-model.png");

    var foggCanvas = document.getElementById("fogg");
    var pointCanvas = document.getElementById("point");
    var combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = foggCanvas.width;
    combinedCanvas.height = foggCanvas.height;
    var ctx = combinedCanvas.getContext("2d");
    ctx.drawImage(foggCanvas, 0, 0);
    ctx.drawImage(pointCanvas, 0, 0);

    combinedCanvas.toBlob(function (blob) {
      let url = URL.createObjectURL(blob);
      downloadLink.setAttribute("href", url);
      downloadLink.click();
    });
  });
}

drawLine();
drawPoint();
saveImage();
