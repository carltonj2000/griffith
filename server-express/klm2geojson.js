const converter = require("@tmcw/togeojson");
const fs = require("fs").promises;
const path = require("path");
const DOMParser = require("xmldom").DOMParser;

const baseDir = "./data";
const fnIn = path.join(baseDir, "Griffith_Pk.kml");
const fnOut = path.join(baseDir, "Griffith_Pk.geojson");

const convert = async () => {
  const data = await fs.readFile(fnIn, "utf8");
  const parsedKML = new DOMParser().parseFromString(data);
  const geojson = converter.kml(parsedKML);
  await fs.writeFile(fnOut, JSON.stringify(geojson, null, 2));
};

module.exports = { convert };
