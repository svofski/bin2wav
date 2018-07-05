#!/usr/bin/env node

var fs = require('fs');
var tapeformat = require('./tape');

var romFile = undefined;    /* input bin/rom file name */
var outFile = undefined;    /* output wav file name */
var loadAddr = 256;          /* load address */
var tapeName = undefined;   /* file name in the tape headers */
var machine = 'v06c-rom';
var konst = undefined;

try {
    var borrow = null;
    for(var i = 2; i < process.argv.length; ++i) {
        var arg = process.argv[i].trim();
        if (borrow) {
            borrow(arg);
            borrow = null;
            continue;
        }

        if (arg[0] == '-') {
            switch (arg[1]) {
                case 'h':
                    throw "halp";
                case 's': 
                    borrow = function(v) {
                        loadAddr = eval(v);
                    };
                    break;
                case 'n':
                    borrow = function(v) {
                        tapeName = v; 
                    };
                    break;
                case 'm':
                    borrow = function(v) {
                        machine = v;
                    };
                    break;
                case 'c':
                    borrow = function(v) {
                        konst = eval(v);
                    };
                    break;
            }
        } else {
            if (!romFile) {
                romFile = arg;
            } else if (!outFile) {
                outFile = arg;
            }
        }
    }

    if (!romFile || !outFile) {
        throw "hapl";
    }

    if (romFile && !tapeName) {
        tapeName = romFile;
    }
} catch (numberwang) {
    console.log('Usage: bin2wav program.rom program.wav [options]');
    console.log('   -s load_addr in C-like notation e.g. 256, 0x100. Default 0x100.');
    console.log('   -n tape_name for Vector-06C name to put in tape headers. Default: rom file name');
    console.log('   -m machine-format (default v06c-rom)'); 
    console.log('   -c speed constant (sane values 5..12)');
    console.log('Available formats:');
    console.log('   rk-bin          Радио 86РК');
    console.log('   mikrosha-bin    Микроша');
    console.log('   partner-bin     Партнер');
    console.log('   v06c-rom        Вектор-06ц ROM');
    console.log('   v06c-cas        Вектор-06ц CAS');
    console.log('   v06c-bas        Вектор-06ц BAS');
    console.log('   krista-rom      Криста-2');
    console.log('   specialist-rks  Специалист .RKS');
    console.log('   specialist-mon  Специалист .MON');
    process.exit(0);
}
console.log('Input file:    ', romFile);
console.log('Output file:   ', outFile);
console.log('Load address:  ', "0x" + loadAddr.toString(16));
console.log('Tape name:     ', tapeName);
console.log('Tape format:   ', machine);

try {
    var romData = fs.readFileSync(romFile);
} catch(numberwang) {
    console.log('Error reading input file: ', romFile);
    process.exit(1);
}
var vectortape = tapeformat.TapeFormat(machine, false, konst);
console.log('Speed:         ', vectortape.speed);
var wav = vectortape.format(romData, loadAddr, tapeName).makewav();

try {
    fs.writeFileSync(outFile, new Buffer(wav));
    console.log('WAV file written to:', outFile);
} catch(numberwang) {
    console.log('Error writing WAV data to ', outFile);
    process.exit(1);
}
