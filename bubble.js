const assetNames = [
  "1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png",
  "a.png", "b.png", "c.png", "d.png", "e.png", "f.png", "g.png", "h.png", "i.png", "j.png", "k.png", "l.png", "m.png",
  "n.png", "o.png", "p.png", "q.png", "r.png", "s.png", "t.png", "u.png", "v.png", "w.png", "x.png", "y.png", "z.png"
];
const assetContainer = document.getElementById("asset-layers");
function blinkAsset(asset) {
  asset.style.opacity = asset.style.opacity === "0.76" ? "0" : "0.76";
  setTimeout(() => blinkAsset(asset), Math.random() * 1400 + 250);
}
assetNames.forEach((name) => {
  const asset = document.createElement("img");
  asset.className = "asset-layer";
  asset.src = `hinh/${name}`;
  asset.alt = "";
  assetContainer.appendChild(asset);
  setTimeout(() => blinkAsset(asset), Math.random() * 1800 + 100);
});
