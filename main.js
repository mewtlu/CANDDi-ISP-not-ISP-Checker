const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');
const dataManip = require('./lib/dataManip');
const similarity = dataManip.similarity;
const ratioUnwanted = dataManip.ratioUnwanted;
const cwdPath = process.cwd();

/**
 *
 * likeliness threshold seems to be pretty accurate at 0.69,
 *	maybe do some more experimenting to perfect it?
 *	for now let's just leave at at 0.67 so we hopefully don't
 *	miss any?
 *
const companyLikelinessThreshold = 0.69;
 */
const companyLikelinessThreshold = 0.67;

var realTypesBuffer = fs.readFileSync(cwdPath + "/types.csv");
var realTypesFileData = realTypesBuffer.toString().split('\n');;
var realTypes = {};

var dataBuffer = fs.readFileSync(cwdPath + "data/fr.csv");
var dataFileData = csvParse(dataBuffer.toString(), { columns: true });
var labels = {};
var typesAttempt = {};
var companyRegEx = /\(c[0-9]{6,}\)/;
var loopCounter = 0;

/* goodCompanies is the list of labels we believe to contain companies, not ISPs/others */
var goodCompanies = [];

for (var f in realTypesFileData) {
	var labelType = realTypesFileData[f].split('    ');

	if (labelType[0] && labelType[1] && labelType[1] !== 'Mixed') {
		realTypes[labelType[0]] = labelType[1];
	}
}

console.log('Data file read.');

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

console.log('Company list created.');

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
	if (averageGuess >= companyLikelinessThreshold) {
		/* Company */
		goodCompanies.push(l);
		//console.log(l);
		//console.log('Label ' + l + ' is a company. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	} else {
		/* ISP */
		//console.log('Label ' + l + ' is an ISP. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	}
}

for (c in goodCompanies) {

}

console.log('-- Done')