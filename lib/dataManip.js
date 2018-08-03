module.exports.similarity = function(stringSet) {
	const stringSimilarity = require('string-similarity');

	var similarityVal = 0;

	var similarities = [];

	for (var s in stringSet) {
		var similarity = stringSimilarity.compareTwoStrings(stringSet[s], stringSet[stringSet.length - s - 1]);
		similarities.push(similarity)
	}

	
	/* Test val: */
	//similarityVal = stringSet.length / 1000 % 1;

	var similarityVal = similarities.reduce(function(a, b) {
		return a + b;
	}) / similarities.length;

	var similarityStr = Math.round(100 * similarityVal) / 100;
	return similarityStr;
}

module.exports.ratioUnwanted = function(stringSet, verbose) {
	var IPRegEx = /([0-9]{1,3}(\.| )){3}[0-9]{0,3}/;
	var UnwantedRegEx = /(^[0-9]{5}$)|([0-9]{4} [0-9]{5} [0-9]{3})|(.*\.rain\.fr)|(.*rue.*)/;
	var matched = 0;

	for (s in stringSet) {
		if (IPRegEx.test(stringSet[s]) || UnwantedRegEx.test(stringSet[s])) {
			if (verbose) {
				console.log(stringSet[s] + ' is an IP.');
			}
			matched++;
		} else {
			if (verbose) {
				console.log(stringSet[s] + ' isn\'t an IP.')
			}
		}
	}

	return Math.round(100 * matched / stringSet.length) / 100;
}