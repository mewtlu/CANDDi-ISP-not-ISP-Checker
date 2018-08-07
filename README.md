# CANDDi ISP-not-ISP Checker

## Summary

This program is _supposed_ to decide whether a csv contains ISP-style entries or companies.

## Installation

Simply run `npm install` in the root directory to install the required packages

## Usage

`node main.js <country code> <max rows> <row> <debug level>`  
Row, debug level, max rows are all optional, to skip an option simply use `false` or `0`  
  
CSV in file should be named `data/xx.csv` where xx is a country code, and should be formatted with row 1 containing a `label` column and a `CompanyName` column.  
If a manually produced checking file is to be used, it should be named `real/xx-real.csv`.  
Output is placed in the `out/` directory as `xx-result.csv`.

## Known bugs

Lots.

## Planned features

Some.

## Prerequisites
+ node
+ npm

### Used NPM packages
+ [csv-parse](http://csv.adaltas.com/)
+ [string-similarity](https://www.npmjs.com/package/string-similarity)
+ [easy-table](https://github.com/eldargab/easy-table)    
