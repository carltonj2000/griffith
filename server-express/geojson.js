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
    const push = results.reduce((push, row) => {
      if (row[0] === items[0]) {
        row.push(items[1]);
        return false;
      }
      return push;
    }, true);
    if (push) results.push(items);
    return results;
  };

const process = async () => {
  const log1 = logger([]);
  const griffithGeojsonText = await fs.readFile(fnIn);
  const griffithGeojson = await JSON.parse(griffithGeojsonText);

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

  log1("Features", featuresSeen);
  log1("Line strings", lineStringsSeen);

  const line = turf.lineString(coordinatesSeen);
  const meters2feet = (meters) => meters * 3.28084;
  const round = (number) => Math.round(number);
  const round10 = (number) => Math.round(number * 10) / 10;
  const round100 = (number) => Math.round(number * 100) / 100;

  const length = round10(turf.length(line, { units: "miles" }));
  const log2 = logger([]);
  log2("miles", length);

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

  log2("min elevation", round(meters2feet(min)));
  log2("max elevation", round(meters2feet(max)));
  log2("elevation difference", round(meters2feet(max - min)));

  const meters = (pt1, pt2) => {
    const from = turf.point([pt1[0], pt1[1]]);
    const to = turf.point([pt2[0], pt2[1]]);
    return turf.distance(from, to) * 1000;
  };

  const metersV = (v1, v2) => Math.sqrt((v1[2] - v2[2]) ** 2);

  const minMaxCord = (coords) =>
    coords.reduce(
      (minmax, coordinate, i) => {
        if (i === 0) return minmax;

        const delta = meters(coords[i - 1], coords[i]);
        const distance = minmax.distance + delta;
        const minDelta =
          minmax.minDelta === -1 ? delta : Math.min(minmax.minDelta, delta);
        const maxDelta =
          minmax.maxDelta === -1 ? delta : Math.max(minmax.maxDelta, delta);

        const deltaV = metersV(coords[i - 1], coords[i]);
        const vertical = minmax.vertical + deltaV;
        const minDeltaV =
          minmax.minDeltaV === -1 ? deltaV : Math.min(minmax.minDeltaV, deltaV);
        const maxDeltaV =
          minmax.maxDeltaV === -1 ? deltaV : Math.max(minmax.maxDeltaV, deltaV);

        return { minDelta, maxDelta, distance, minDeltaV, maxDeltaV, vertical };
      },
      {
        minDelta: -1,
        maxDelta: -1,
        distance: 0,
        minDeltaV: -1,
        maxDeltaV: -1,
        vertical: 0,
      }
    );

  const log = logger([]);
  const minMaxCordLog = (coords) => {
    const { minDelta, maxDelta, distance, minDeltaV, maxDeltaV, vertical } =
      minMaxCord(coords);
    log("minimum difference (meters)", round100(minDelta));
    log("maximum difference (meters)", round100(maxDelta));
    log("distance (miles)", round10(distance / 1609.34));
    log("minimum vertical", minDeltaV);
    log("maximum vertical", round(maxDeltaV));
    log("vertical (meters)", round(vertical));
  };

  minMaxCordLog(coordinatesSeen);
  log("total Coordinates", coordinatesSeen.length);

  const coordGt = (gt) =>
    coordinatesSeen.reduce((a, c, i) => {
      if (i === 0) a.push(c);
      if (meters(a[a.length - 1], c) > gt) a.push(c);
      return a;
    }, []);

  const cordsGt10m = coordGt(10);
  log("total Coordinates", cordsGt10m.length);
  const cordsGt20m = coordGt(20);
  log("total Coordinates", cordsGt20m.length);

  console.log(coordinatesSeen.length, cordsGt10m.length);

  minMaxCordLog(cordsGt10m);
  minMaxCordLog(cordsGt20m);

  const table1 = [["GPS Meta", "#"], ...log1()];
  const table2 = [["GPS Summary", "#"], ...log2()];
  const table3 = [["GPS Calculated", "#", "> 10", "> 20"], ...log()];
  const logs = [[table3], [table2, table1]];
  await fs.writeFile(fnOut, JSON.stringify(logs, null, 2));
};

module.exports = { process };
