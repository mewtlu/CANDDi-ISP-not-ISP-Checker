const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');
const dataManip = require('./lib/dataManip');
const similarity = dataManip.similarity;
const ratioUnwanted = dataManip.ratioUnwanted;
const cwdPath = process.cwd();

var realTypesBuffer = fs.readFileSync(cwdPath + "/types.csv");
var realTypesFileData = realTypesBuffer.toString();
var realTypes = {};

realTypesFileData = realTypesFileData.split('\n');

for (var f in realTypesFileData) {
	var labelType = realTypesFileData[f].split('    ');

	if (labelType[0] && labelType[1] && labelType[1] !== 'Mixed') {
		realTypes[labelType[0]] = labelType[1];
	}
}

var dataBuffer = fs.readFileSync(cwdPath + "/data.csv");
var dataFileData = csvParse(dataBuffer.toString(), {
	columns: true
});
var labels = {};
var typesAttempt = {};

console.log('Read data file.');

for (var r in dataFileData) {
	var data = dataFileData[r];

	var companyName = data['CompanyName'];
	var label = data['label'];

	if (!label || !companyName) {
		continue;
	}

	if (!labels[label]) {
		labels[label] = [];
	}
	labels[label].push(companyName);
}

console.log('List of values created.');

var companyRegEx = /\(c[0-9]{6,}\)/;

console.log('-- Companies:')
for (var l in labels) {
	var total = 0;

	/*
	if (l != 40) continue;
	*/
	if (l > 150) {
		break;
	}

	var labelsSimilarity = similarity(labels[l]);
	var ratioValuesIPs = ratioUnwanted(labels[l], 0);

	var averageGuess = 1 - Math.round(100 * (labelsSimilarity + ratioValuesIPs) / 2) / 100;
	if (averageGuess >= 0.69) {
		console.log('', l);
		//console.log('Label ' + l + ' is a company. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	} else {
		//console.log('Label ' + l + ' is an ISP. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	}
}
console.log('-- Done')