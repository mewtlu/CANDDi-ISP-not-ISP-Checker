const fs = require('fs');
const levensteinDistance = require('./lib/levenshtein').getEditDistance;
const csv = require('csv');

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
var dataFileData = dataBuffer.toString().replace(/"/g, '').split('\n');

var labels = {};
var typesAttempt = {};
var distanceBoundary = 21000;

for (var r in dataFileData) {
	var data = dataFileData[r].split(',');

	var companyName = data[1];
	var label = data[8];

	if (!label || !companyName) {
		continue;
	}

	companyName = companyName.replace('~~', ',');

	if (!labels[label]) {
		labels[label] = [];
	}
	labels[label].push(companyName);
}

var ISPRegEx = /([0-9]{1,3}(\.| )){3}[0-9]{1,3}/;
var companyRegEx = /\(c[0-9]{6,}\)/;

for (var l in labels) {
	var match = 0;
	var total = 0;
	var totalDistance = 0;
	var last;

	if (l > 40) {
		break;
	}

	for (var c in labels[l]) {
		total++;
		var isISP = ISPRegEx.test(labels[l][c]);
		var isCompany = companyRegEx.test(labels[l][c]);

		if (last && !isISP) {
			totalDistance += levensteinDistance(last, labels[l][c]);
		}

		last = labels[l][c];
		/*
		var isISP = ISPRegEx.test(labels[l][c]);
		var isCompany = companyRegEx.test(labels[l][c]);
		//if(l==38 && isISP && !isCompany) console.log(labels[l][c], isISP, !isCompany)
		if (isISP && !isCompany) {
			// looks like ISP
			match++;
		} else {
			// looks like company
			match--;
		}
		*/
	}

	if (totalDistance <= distanceBoundary) {
		console.log('Label ' + l + ' is an ISP. Certainty: ' + totalDistance + '. Example: ' + labels[l][c])
	} else {
		console.log('Label ' + l + ' is a company. Certainty: ' + totalDistance + '. Example: ' + labels[l][c])
	}
	//console.log('Similarity: ' + totalDistance);
	/*
	if (match >= 0) {
		console.log('Label ' + l + ' is a ISP. Certainty: ' + Math.round(100 * Math.abs(match) / total) + '%. Example: ' + labels[l][c])
	} else {
		console.log('Label ' + l + ' is a company. Certainty: ' + Math.round(100 * Math.abs(match) / total) + '%. Example: ' + labels[l][c])
	}
	*/
}