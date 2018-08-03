const fs = require('fs');
const levensteinDistance = require('./lib/levenshtein').getEditDistance;
const csvParse = require('csv-parse/lib/sync');

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
var distanceThreshhold = 21000;

for (var r in dataFileData) {
	var data = dataFileData[r];

	var companyName = data.CompanyName;
	var label = data['label'];

	if (!label || !companyName) {
		continue;
	}

	if (!labels[label]) {
		labels[label] = [];
	}
	labels[label].push(companyName);
}

var ISPRegEx = /([0-9]{1,3}(\.| )[a-z]{3} ?){3}[0-9]{1,3}/;
var companyRegEx = /\(c[0-9]{6,}\)/;
var matched = {};

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
			if (!matched[labels[l]]) {
				matched[labels[l]] = [];
			}
			matched[labels[l]].push(labels[l][c]);
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

	if (totalDistance <= distanceThreshhold) {
		console.log('Label ' + l + ' is an ISP. Certainty: ' + totalDistance + '. Example: ' + labels[l][c])
	} else {
		console.log('Label ' + l + ' is a company. Certainty: ' + totalDistance + '. Example: ' + labels[l][c])
	}
	console.log(matched[0])
	//console.log('Similarity: ' + totalDistance);
	/*
	if (match >= 0) {
		console.log('Label ' + l + ' is a ISP. Certainty: ' + Math.round(100 * Math.abs(match) / total) + '%. Example: ' + labels[l][c])
	} else {
		console.log('Label ' + l + ' is a company. Certainty: ' + Math.round(100 * Math.abs(match) / total) + '%. Example: ' + labels[l][c])
	}
	*/
}