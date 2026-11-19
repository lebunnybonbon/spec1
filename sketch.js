let menu = [
  ["Music App", 25000], ["Best-seller items", 30000], ["Coquette girl", 35000],
  ["Performative", 10000], ["IT Girl", 28000], ["ABG", 18000],
  ["Ghệ tone hồng", 45000], ["Nàng thơ", 32000], ["Indie", 27000],
  ["Racing Boiz", 55000]
];

let invoices = [];
let barcodes = [];
let draggedInvoice = -1;
let draggedBarcode = -1;
let dragOffsetX = 0;
let dragOffsetY = 0;
let updateSpeed = 60;
let spawnSpeed = 180; // 180 frames = khoảng 3 giây ở 60 FPS.
let trashX;
let trashY;
let trashW = 360;
let trashH = 390;
let trashZoneX = 0;
let trashZoneY;
let trashZoneW = 430;
let trashZoneH;
let snapHoldBuffer = 120;

function setup() {
  pixelDensity(1);
  let canvas = createCanvas(1920, 1080);
  canvas.parent("sketch-holder");
  textFont("monospace");
  trashX = width - trashW - 30;
  trashY = height - trashH;
  // Vùng snap bám quanh đúng khung của thùng rác.
  trashZoneX = trashX - 20;
  trashZoneY = trashY - 70;
  trashZoneW = trashW + 40;
  trashZoneH = trashH + 70;

  // Tạo tổng cộng 5 hóa đơn ở những vị trí khác nhau.
  let startX = [760, 700, 820, 740, 860];
  let startY = [130, 200, 90, 250, 160];
  for (let i = 0; i < 5; i = i + 1) {
    addInvoice(startX[i], startY[i], i % 2 === 0);
  }
  addBarcode(290, 560);
}

function draw() {
  background(230, 226, 211);

  if (frameCount % updateSpeed === 0) {
    for (let i = 0; i < invoices.length; i = i + 1) {
      makeRandomInvoice(invoices[i]);
    }
  }

  if (frameCount % spawnSpeed === 0 && invoices.length < 10) {
    addRandomInvoice(invoices.length % 2 === 0);
  }

  if (frameCount % spawnSpeed === 0 && barcodes.length < 10) {
    addRandomBarcode();
  }

  for (let i = 0; i < invoices.length; i = i + 1) {
    drawReceipt(invoices[i]);
  }

  for (let i = 0; i < barcodes.length; i = i + 1) {
    updateBarcode(barcodes[i]);
    drawBarcode(barcodes[i]);
  }
}

function addBarcode(x, y) {
  let barcode = {
    x: x, y: y, w: 300, h: 165,
    digits: "", bars: [],
    snapped: false,
    inverted: random(1) > 0.5
  };
  randomizeBarcode(barcode);
  keepBarcodeInsideCanvas(barcode);
  barcodes.push(barcode);
}

function addRandomBarcode() {
  let barcodeW = 300;
  let barcodeH = 165;
  let barcodeX = random(35, width - barcodeW - 35);
  let barcodeY = random(80, height - barcodeH - 60);
  let tries = 0;

  while (isNearTrash(barcodeX, barcodeY, { w: barcodeW, h: barcodeH }) && tries < 100) {
    barcodeX = random(35, width - barcodeW - 35);
    barcodeY = random(80, height - barcodeH - 60);
    tries = tries + 1;
  }

  addBarcode(barcodeX, barcodeY);
}

function randomizeBarcode(barcode) {
  barcode.digits = "";
  for (let i = 0; i < 13; i = i + 1) {
    barcode.digits = barcode.digits + floor(random(10));
  }

  let barCount = 34;
  let usableWidth = barcode.w - 78;
  let totalWeight = 0;
  let weights = [];
  for (let i = 0; i < barCount; i = i + 1) {
    let weight = random(0.35, 2.4);
    weights.push(weight);
    totalWeight = totalWeight + weight;
  }

  barcode.bars = [];
  for (let i = 0; i < weights.length; i = i + 1) {
    barcode.bars.push(usableWidth * weights[i] / totalWeight);
  }
}

function updateBarcode(barcode) {
  if (frameCount % 14 === 0) {
    randomizeBarcode(barcode);
  }
}

function drawBarcode(barcode) {
  let barcodeBackground = barcode.inverted ? 0 : 255;
  let barcodeForeground = barcode.inverted ? 255 : 0;

  push();
  noStroke();
  fill(barcodeBackground);
  rect(barcode.x, barcode.y, barcode.w, barcode.h, 22);

  let barX = barcode.x + 39;
  let barTop = barcode.y + 28;
  let barHeight = 84;
  for (let i = 0; i < barcode.bars.length; i = i + 1) {
    let barWidth = barcode.bars[i];
    if (i % 2 === 0) {
      fill(barcodeForeground);
      rect(barX, barTop, max(2, barWidth - 3), barHeight);
    }
    barX = barX + barWidth;
  }

  fill(barcodeForeground);
  textAlign(CENTER, TOP);
  textFont("serif");
  textSize(24);
  let digitSpacing = (barcode.w - 64) / (barcode.digits.length - 1);
  for (let i = 0; i < barcode.digits.length; i = i + 1) {
    text(barcode.digits[i], barcode.x + 32 + i * digitSpacing, barcode.y + 122);
  }
  pop();
}

function keepBarcodeInsideCanvas(barcode) {
  if (barcode.x < 0) barcode.x = 0;
  if (barcode.x + barcode.w > width) barcode.x = width - barcode.w;
  if (barcode.y < 0) barcode.y = 0;
  if (barcode.y + barcode.h > height) barcode.y = height - barcode.h;
}

function addInvoice(x, y, darkTheme) {
  let invoice = {
    x: x, y: y, w: 410, h: 525,
    products: [], total: 0, cash: 0,
    dark: darkTheme,
    snapped: false,
    qrPattern: [],
    qrInverted: false
  };
  makeRandomInvoice(invoice);
  invoices.push(invoice);
}

function addRandomInvoice(darkTheme) {
  let invoice = {
    x: 0, y: 0, w: 410, h: 525,
    products: [], total: 0, cash: 0,
    dark: darkTheme,
    snapped: false
  };
  makeRandomInvoice(invoice);

  // Thử vị trí mới cho đến khi hóa đơn không nằm gần thùng rác.
  let tries = 0;
  do {
    invoice.x = random(width - invoice.w);
    invoice.y = random(80, height - 850);
    tries = tries + 1;
  } while (isNearTrash(invoice.x, invoice.y, invoice) && tries < 100);

  invoices.push(invoice);
}

function makeRandomInvoice(invoice) {
  invoice.products = [];
  let numberOfProducts = floor(random(11));

  for (let i = 0; i < numberOfProducts; i = i + 1) {
    let menuIndex = floor(random(menu.length));
    let quantity = floor(random(1, 4));
    invoice.products.push([menu[menuIndex][0], quantity, menu[menuIndex][1]]);
  }

  invoice.total = 0;
  for (let i = 0; i < invoice.products.length; i = i + 1) {
    let product = invoice.products[i];
    invoice.total = invoice.total + product[1] * product[2];
  }

  invoice.cash = floor((invoice.total + random(20000, 100000)) / 10000 + 1) * 10000;
  invoice.h = 525 + invoice.products.length * 30;
  invoice.qrInverted = random(1) > 0.5;
  invoice.qrPattern = makeRandomQRPattern();
  keepInsideCanvas(invoice);
}

function makeRandomQRPattern() {
  let pattern = [];
  for (let row = 0; row < 17; row = row + 1) {
    let line = "";
    for (let col = 0; col < 17; col = col + 1) {
      if (random(1) > 0.5) {
        line = line + "1";
      } else {
        line = line + "0";
      }
    }
    pattern.push(line);
  }
  return pattern;
}

function keepInsideCanvas(invoice) {
  if (invoice.x < 0) invoice.x = 0;
  if (invoice.x + invoice.w > width) invoice.x = width - invoice.w;
  if (invoice.y < 0) invoice.y = 0;
  if (invoice.y + invoice.h > height) invoice.y = height - invoice.h;
}

function drawReceipt(invoice) {
  let leftX = invoice.x + 30;
  let rightX = invoice.x + invoice.w - 30;
  let centerX = invoice.x + invoice.w / 2;
  let paperColor = invoice.dark ? 0 : 255;
  let inkColor = invoice.dark ? 255 : 0;

  noStroke();
  fill(paperColor);
  rect(invoice.x, invoice.y, invoice.w, invoice.h, 3);

  fill(inkColor);
  textAlign(CENTER, TOP);
  textSize(27);
  text("SHOPPING FOR LIFE", centerX, invoice.y + 30);
  textSize(14);
  text("WHY STOP?", centerX, invoice.y + 65);

  textAlign(LEFT, TOP);
  textSize(13);
  text("Đâu đó không ở mặt đất", leftX, invoice.y + 100);
  text("Điện thoại: 0 còn là 9 mình nữa rồi 3 mẹ ơi", leftX, invoice.y + 122);
  text("Ngày: 12/11/2026", leftX, invoice.y + 154);
  text("Giờ: 10:35", rightX - 95, invoice.y + 154);

  drawDashedLine(leftX, invoice.y + 182, rightX, invoice.y + 182, inkColor);
  textSize(13);
  text("MẶT HÀNG (" + invoice.products.length + ")", leftX, invoice.y + 198);
  textAlign(RIGHT, TOP);
  text("THÀNH TIỀN", rightX, invoice.y + 198);
  drawDashedLine(leftX, invoice.y + 224, rightX, invoice.y + 224, inkColor);

  drawProducts(invoice, leftX, rightX, inkColor);
  drawSummary(invoice, leftX, rightX, inkColor);

  let qrY = invoice.y + 250 + invoice.products.length * 30 + 130;
  let qrForeground = invoice.qrInverted ? 255 : 0;
  let qrBackground = invoice.qrInverted ? 0 : 255;
  drawFakeQR(centerX - 55, qrY, 110, invoice.qrPattern, qrForeground, qrBackground);
  textAlign(CENTER, TOP);
  textSize(12);
  text("Nhớ quay lại, kẻo lỗi thời", centerX, qrY + 120);
}

function drawProducts(invoice, leftX, rightX, inkColor) {
  let y = invoice.y + 250;
  textSize(13);
  textAlign(LEFT, TOP);

  for (let i = 0; i < invoice.products.length; i = i + 1) {
    let product = invoice.products[i];
    let name = product[0] + " x" + product[1];
    let price = product[1] * product[2];
    text(name, leftX, y);
    textAlign(RIGHT, TOP);
    text(formatMoney(price), rightX, y);
    textAlign(LEFT, TOP);
    y = y + 30;
  }

  drawDashedLine(leftX, y + 3, rightX, y + 3, inkColor);
}

function drawSummary(invoice, leftX, rightX, inkColor) {
  let change = invoice.cash - invoice.total;
  let summaryY = invoice.y + 250 + invoice.products.length * 30 + 25;

  fill(inkColor);
  textAlign(LEFT, TOP);
  textSize(21);
  text("CỔNG TỘNG", leftX, summaryY);
  textAlign(RIGHT, TOP);
  text(formatMoney(invoice.total), rightX, summaryY);

  textSize(14);
  textAlign(LEFT, TOP);
  text("Tiền khách đưa", leftX, summaryY + 40);
  textAlign(RIGHT, TOP);
  text(formatMoney(invoice.cash), rightX, summaryY + 40);
  textAlign(LEFT, TOP);
  text("Tiền thối lại", leftX, summaryY + 68);
  textAlign(RIGHT, TOP);
  text(formatMoney(change), rightX, summaryY + 68);
}

function drawDashedLine(x1, y1, x2, y2, lineColor) {
  stroke(lineColor);
  strokeWeight(2);
  for (let x = x1; x < x2; x = x + 10) {
    line(x, y1, x + 5, y2);
  }
  noStroke();
}

function formatMoney(number) {
  return number.toLocaleString("vi-VN") + " đ";
}

function mousePressed() {
  for (let i = barcodes.length - 1; i >= 0; i = i - 1) {
    let barcode = barcodes[i];
    if (mouseX > barcode.x && mouseX < barcode.x + barcode.w &&
        mouseY > barcode.y && mouseY < barcode.y + barcode.h) {
      let selected = barcodes.splice(i, 1)[0];
      barcodes.push(selected);
      draggedBarcode = barcodes.length - 1;
      dragOffsetX = mouseX - selected.x;
      dragOffsetY = mouseY - selected.y;
      selected.snapped = false;
      return;
    }
  }

  // Duyệt ngược để chọn hóa đơn đang nằm trên cùng.
  for (let i = invoices.length - 1; i >= 0; i = i - 1) {
    let invoice = invoices[i];
    if (mouseX > invoice.x && mouseX < invoice.x + invoice.w &&
        mouseY > invoice.y && mouseY < invoice.y + invoice.h) {
      let selected = invoices.splice(i, 1)[0];
      invoices.push(selected);
      draggedInvoice = invoices.length - 1;
      dragOffsetX = mouseX - selected.x;
      dragOffsetY = mouseY - selected.y;
      selected.snapped = false;
      break;
    }
  }
}

function mouseDragged() {
  if (draggedBarcode !== -1) {
    let barcode = barcodes[draggedBarcode];
    let nextX = mouseX - dragOffsetX;
    let nextY = mouseY - dragOffsetY;

    if (!barcode.snapped && isNearTrash(nextX, nextY, barcode)) {
      barcode.x = trashX + (trashW - barcode.w) / 2;
      barcode.y = trashY + 25;
      barcode.snapped = true;
    } else if (barcode.snapped && !isInsideTrashHoldZone(nextX, nextY, barcode)) {
      barcode.x = nextX;
      barcode.y = nextY;
      barcode.snapped = false;
      keepBarcodeInsideCanvas(barcode);
    } else if (barcode.snapped) {
      barcode.x = trashX + (trashW - barcode.w) / 2;
      barcode.y = trashY + 25;
    } else {
      barcode.x = nextX;
      barcode.y = nextY;
      barcode.snapped = false;
      keepBarcodeInsideCanvas(barcode);
    }
    return;
  }

  if (draggedInvoice !== -1) {
    let invoice = invoices[draggedInvoice];
    let nextX = mouseX - dragOffsetX;
    let nextY = mouseY - dragOffsetY;

    if (!invoice.snapped && isNearTrash(nextX, nextY, invoice)) {
      invoice.x = trashX + 10;
      invoice.y = trashY - 150;
      invoice.snapped = true;
    } else if (invoice.snapped && !isInsideTrashHoldZone(nextX, nextY, invoice)) {
      invoice.x = nextX;
      invoice.y = nextY;
      invoice.snapped = false;
      keepInsideCanvas(invoice);
    } else if (invoice.snapped) {
      // Khi đã snap, phải kéo ra xa hơn vùng snap mới nhả ra.
      invoice.x = trashX + 10;
      invoice.y = trashY - 150;
    } else {
      invoice.x = nextX;
      invoice.y = nextY;
      invoice.snapped = false;
      keepInsideCanvas(invoice);
    }
  }
}

function mouseReleased() {
  if (draggedBarcode !== -1 && barcodes[draggedBarcode].snapped) {
    let trashSound = document.getElementById("trash-sound");
    trashSound.currentTime = 0;
    trashSound.play().catch(() => {});
    barcodes.splice(draggedBarcode, 1);
  }
  draggedBarcode = -1;

  if (draggedInvoice !== -1 && invoices[draggedInvoice].snapped) {
    let trashSound = document.getElementById("trash-sound");
    trashSound.currentTime = 0;
    trashSound.play();
    invoices.splice(draggedInvoice, 1);
  }
  draggedInvoice = -1;
}

function isNearTrash(x, y, invoice) {
  let centerX = x + invoice.w / 2;
  let centerY = y + invoice.h / 2;
  return centerX > trashZoneX && centerX < trashZoneX + trashZoneW &&
    centerY > trashZoneY && centerY < trashZoneY + trashZoneH;
}

function isInsideTrashHoldZone(x, y, invoice) {
  let centerX = x + invoice.w / 2;
  let centerY = y + invoice.h / 2;
  return centerX > trashZoneX - snapHoldBuffer &&
    centerX < trashZoneX + trashZoneW + snapHoldBuffer &&
    centerY > trashZoneY - snapHoldBuffer &&
    centerY < trashZoneY + trashZoneH + snapHoldBuffer;
}

function keyPressed() {
  if (key === "f" || key === "F") {
    fullscreen(!fullscreen());
  }
}

function drawFakeQR(x, y, size, grid, foreground, background) {
  let cell = size / grid.length;
  noStroke();
  fill(background);
  rect(x, y, size, size);
  fill(foreground);
  for (let row = 0; row < grid.length; row = row + 1) {
    for (let col = 0; col < grid[row].length; col = col + 1) {
      if (grid[row][col] === "1") {
        rect(x + col * cell, y + row * cell, cell, cell);
      }
    }
  }
}
