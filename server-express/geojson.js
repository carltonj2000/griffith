const path = require("path");
const fs = require("fs").promises;
const turf = require("@turf/turf");

const baseDir = "./data";
const fnIn = path.join(baseDir, "Griffith_Pk.geojson");
const fnOut = path.join(baseDir, "Griffith_Pk.json");

const logger =
  (results = [], dbg = false) =>
  (...items) => {
    if (items.length === 0) return results;
    if (dbg) console.log(items);
    results.push(items);
    return results;
  };

const process = async () => {
  const log = logger();
  const griffithGeojsonText = await fs.readFile(fnIn);
  const griffithGeojson = await JSON.parse(griffithGeojsonText);

  //const convexHull = turf.convex(griffithGeojson);
  //await fs.writeFile("./convex_hull.geojson", JSON.stringify(convexHull, null, 2));

  let featuresSeen = 0;
  let lineStringsSeen = 0;
  let coordinatesSeen = [];
  turf.featureEach(griffithGeojson, function (currentFeature, featureIndex) {
    if (currentFeature.geometry.type === "LineString") {
      lineStringsSeen++;
      coordinatesSeen = coordinatesSeen.concat(
        currentFeature.geometry.coordinates
      );
    }
    featuresSeen++;
  });

  log(featuresSeen, "features");
  log(lineStringsSeen, "line strings");

  const line = turf.lineString(coordinatesSeen);
  const meters2feet = (meters) => meters * 3.28084;
  const rounded = (number) => Math.round(number);
  const rounded10 = (number) => Math.round(number * 10) / 10;

  const length = rounded10(turf.length(line, { units: "miles" }));
  log(length, "miles");

  const { min, max } = coordinatesSeen.reduce(
    (minmax, coordinate) => {
      const min =
        minmax.min === -1 ? coordinate[2] : Math.min(minmax.min, coordinate[2]);
      const max =
        minmax.max === -1 ? coordinate[2] : Math.max(minmax.max, coordinate[2]);
      return { min, max };
    },
    { min: -1, max: -1 }
  );

  log(rounded(meters2feet(min)), "min elevation");
  log(rounded(meters2feet(max)), "max elevation");
  log(rounded(meters2feet(max - min)), "elevation difference");

  const { minDelta, maxDelta } = coordinatesSeen.reduce(
    (minmax, coordinate) => {
      const min =
        minmax.min === -1 ? coordinate[2] : Math.min(minmax.min, coordinate[2]);
      const max =
        minmax.max === -1 ? coordinate[2] : Math.max(minmax.max, coordinate[2]);
      return { min, max };
    },
    { min: -1, max: -1 }
  );

  await fs.writeFile(fnOut, JSON.stringify(log(), null, 2));
};

module.exports = { process };
