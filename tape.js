/* Tape stuff */

var wavmodule = require('./makewav');

const END_PADDING = 128;

var TapeFormat = function(fmt, forfile, konst, leader, sampleRate) {
    this.format = null;
    this.variant = null;
    this.speed = 12;
    this.forfile = forfile || false; /* true if no leaders, no sync bytes */
    this.leader_length = leader || 256;
    this.sampleRate = sampleRate || 22050;
    switch (fmt) {
        case 'rk-bin':
        case 'rk86-bin':
        case '86rk-bin':
            this.format = TapeFormat.prototype.nekrosha;
            this.variant = 'rk';
            this.speed = konst || 12;
            break;
        case 'rk-rk':
            this.format = TapeFormat.prototype.rkrk;
            this.speed = konst || 12;
            break;
        case 'mikrosha-bin':
        case 'microsha-bin':
        case 'microcha-bin':
        case 'necrosha-bin':
        case 'nekrosha-bin':
        case 'necro-bin':
        case 'nekro-bin':
            this.format = TapeFormat.prototype.nekrosha;
            this.variant = 'mikrosha';
            this.speed = konst || 12;
            break;
        case 'partner-bin':
            this.format = TapeFormat.prototype.nekrosha;
            this.variant = 'rk';
            this.speed = konst || 8;
            break;
        case 'v06c-rom':
            this.format = TapeFormat.prototype.v06c_rom;
            this.speed = konst || 7;
            break;
        case 'v06c-cas':
            this.format = TapeFormat.prototype.v06c_cas;
            this.speed = konst || 8;
            break;
        case 'v06c-bas':
            this.format = TapeFormat.prototype.v06c_bas;
            this.speed = konst || 8;
            break;
        case 'v06c-mon':
            this.format = TapeFormat.prototype.v06c_mon;
            this.speed = konst || 8;
            break;
        case 'v06c-edasm':
            this.format = TapeFormat.prototype.v06c_edasm;
            this.speed = konst || 17;
            break;
        case 'v06c-savedos':
            this.format = TapeFormat.prototype.v06c_savedos;
            this.speed = konst || 9;
            break;
        case 'v06c-loadfm':
            this.format = TapeFormat.prototype.v06c_loadfm;
            this.speed = 5;
            break;
        case 'krista-rom':
            this.format = TapeFormat.prototype.krista;
            this.speed = konst || 7;
            break;
        case 'ÓÐÅÃÉÁÌÉÓÔß-rks': // кои-8 факъ е
        case 'spetsialist-rks':
        case 'specialist-rks':
        case 'spec-rks':
            this.format = TapeFormat.prototype.specialist;
            this.speed = konst || 9;
            this.variant = null;
            break;
        case 'ÓÐÅÃÉÁÌÉÓÔß-mon': // кои-8 факъ е
        case 'spetsialist-mon':
        case 'specialist-mon':
        case 'spec-mon':
            this.format = TapeFormat.prototype.specialist;
            this.speed = konst || 9;
            this.variant = "name-header";
            break;
    }
    this.makewav = TapeFormat.prototype.makewav;
    return this;
}

/*
 * Элемент  Размер, байт
 * Ракорд (нулевые байты)   256
 * Синхробайт (E6h)         1
 * Начальный адрес в ОЗУ    2  -- отсюда и дальше как есть из файла ---\
 * Конечный адрес в ОЗУ     2
 * Данные   (конечный адрес - начальный адрес + 1)
 * Ракорд (нулевые байты)   2
 * Синхробайт (E6h)         1
 * Контрольная сумма        2
 * 0 0 0 0 0 svo: pad with some zeroes in the end
 */
TapeFormat.prototype.rkrk = function(mem, org, name) {
    var data = new Uint8Array(mem.length + this.leader_length + 1);

    // rk-style checksum
    var cs_hi = 0;
    var cs_lo = 0;

    // microsha-style checksum
    var csm_hi = 0;
    var csm_lo = 0;

    var dptr = 0;
    if (!this.forfile) {
        for (var i = 0; i < this.leader_length; ++i) {
            data[dptr++] = 0;
        }
        data[dptr++] = 0xe6;
    }

    for (var i = 0; i < mem.length; ++i) {
        let octet = mem[i];
        data[dptr++] = octet;
        cs_lo += octet;
        if (i < mem.length - 1) {
            cs_hi += octet + ((cs_lo >> 8) & 0xff);
        }
        cs_lo &= 0xff;

        if (i % 2 === 0) {
            csm_lo ^= octet;
        } else {
            csm_hi ^= octet;
        }
    }

    this.data = data;
    return this;
};



/*
 * Элемент  Размер, байт
 * Ракорд (нулевые байты)   256
 * Синхробайт (E6h)         1
 * Начальный адрес в ОЗУ    2
 * Конечный адрес в ОЗУ     2
 * Данные   (конечный адрес - начальный адрес + 1)
 * Ракорд (нулевые байты)   2
 * Синхробайт (E6h)         1
 * Контрольная сумма        2
 * 0 0 0 0 0 svo: pad with some zeroes in the end
 */
TapeFormat.prototype.nekrosha = function(mem, org, name) {
    var data = new Uint8Array(mem.length + 266 + 5);

    // rk-style checksum
    var cs_hi = 0;
    var cs_lo = 0;

    // microsha-style checksum
    var csm_hi = 0;
    var csm_lo = 0;

    var dptr = 0;
    if (!this.forfile) {
        for (var i = 0; i < 256; ++i) {
            data[dptr++] = 0;
        }
        data[dptr++] = 0xe6;
    }

    data[dptr++] = (org >> 8) & 0xff;
    data[dptr++] = org & 0xff;
    data[dptr++] = ((org + mem.length - 1) >> 8) & 0xff;
    data[dptr++] = (org + mem.length - 1) & 0xff;

    for (var i = 0; i < mem.length; ++i) {
        let octet = mem[i];
        data[dptr++] = octet;
        cs_lo += octet;
        if (i < mem.length - 1) {
            cs_hi += octet + ((cs_lo >> 8) & 0xff);
        }
        cs_lo &= 0xff;

        if (i % 2 === 0) {
            csm_lo ^= octet;
        } else {
            csm_hi ^= octet;
        }
    }

    //console.log('checksum rk=', Util.hex8(cs_hi&0377), Util.hex8(cs_lo&0377));
    //console.log('checksum microsha=', Util.hex8(csm_hi&0377),
    //        Util.hex8(csm_lo&0377));

    if (this.variant === 'mikrosha') {
        data[dptr++] = csm_hi & 0xff;
        data[dptr++] = csm_lo & 0xff;
    } else {
        data[dptr++] = 0;
        data[dptr++] = 0;
    }
    data[dptr++] = 0xe6;

    /* rk86 checksum */
    data[dptr++] = cs_hi & 0xff;
    data[dptr++] = cs_lo & 0xff;
    var end = dptr;
    data[dptr++] = 0;
    data[dptr++] = 0;
    data[dptr++] = 0;
    data[dptr++] = 0;
    data[dptr++] = 0;
    if (this.forfile) {
        this.data = data.slice(0, end);
    } else {
        this.data = data;
    }
    return this;
};

TapeFormat.prototype.makewav = function()
{
    var encoded = TapeFormat.prototype.biphase(this.data, this.speed || 12);
    var params = {sampleRate:this.sampleRate, channels: 1};
    wav = wavmodule.Wav(params);
    wav.setBuffer(encoded);
    var stream = wav.getBuffer(encoded.length + wav.getHeaderSize());
    return stream;
}


TapeFormat.prototype.biphase = function(data, halfperiod) {
    var w = new Uint8Array(data.length * 8 * 2 * halfperiod + END_PADDING);
    const period = halfperiod * 2;
    var dptr = 0;
    for (var i = 0, end = data.length; i < end; i += 1) {
        let octet = data[i];
        for (var b = 0; b < 8; ++b, octet <<= 1) {
            //let phase = (octet & 0200) ? -128 : 127;
            let phase = (octet & 0x80) ? 32 : (255 - 32);
            for (var q = 0; q < halfperiod; ++q) w[dptr++] = phase;
            phase = phase ^ 255;
            for (var q = 0; q < halfperiod; ++q) w[dptr++] = phase;
        }
    }
    for (var i = 0; i < END_PADDING; ++i) {
        w[dptr++] = 128;
    }
    return w;
};

/* 4[ 25[00] 25[55] ]  record preamble
 * 16[00]   block preamble
 *  4[55] [E6]
 *      4[00] 25[filename] 2[00]  [hi(addr)] [block count] [block number] [cs0]
 *  4[00] [E6]
 *      [80] [cs0]
 *      32[data] [checksum_data]
 *  4[00] [E6]
 *      [81] [cs0]
 *      32[data] [checksum_data]
 *   . . .
 *  4[00] [E6]
 *      [87] [cs0]
 *      32[data] [checksum_data]
 *
 * Sizes:
 *      record preamble                 =200
 *
 *      one block:
 *          preamble             16
 *          name:                40
 *          data:                40 x 8
 *          total:                      =376
 *      N_blocks = (data size + 255) / 256
 *      Grand Total                     =200 + N_blocks * 376 + end padding 8
 */
TapeFormat.prototype.v06c_rom = function(mem, org, name) {
    var nblocks = Math.trunc((mem.length + 255) / 256);
    var data = new Uint8Array(200 + nblocks * 376 + 64);
    var dofs = 0;
    var sofs = 0;
    /* Preamble */
    for (var i = 0; i < 200; ++i) {
        data[dofs++] = ((Math.trunc(i / 25) % 2) === 0) ? 0x00 : 0x55;
    }

    /* Blocks */
    for (var block = 0; block < nblocks; ++block) {
        /* Checksum of the name subbbbblock */
        var cs0 = 0;

        /* Block preamble */
        for (var i = 0; i < 16; ++i) data[dofs++] = 0;
        /* Name subblock id */
        for (var i = 0; i < 4; ++i) data[dofs++] = 0x55;
        data[dofs++] = 0xE6;
        for (var i = 0; i < 4; ++i) data[dofs++] = 0x00;
        /* Name */
        for (var i = 0; i < 25; ++i) {
            cs0 += data[dofs++] = i < name.length ? name.charCodeAt(i) : 0x20;
        }
        data[dofs++] = data[dofs++] = 0;
        /* High nibble of org address */
        cs0 += data[dofs++] = 0xff & (org >> 8); /* TODO: fix misaligned org */
        /* Block count */
        cs0 += data[dofs++] = nblocks;
        /* Block number */
        cs0 += data[dofs++] = nblocks - block;
        data[dofs++] = cs0 & 0xff;

        /* Now the actual data: 8x32 octets */
        for (var sblk = 0x80; sblk < 0x88; ++sblk) {
            var cs = 0;
            for (var i = 0; i < 4; ++i) data[dofs++] = 0x00;
            data[dofs++] = 0xE6;
            cs += data[dofs++] = sblk;
            cs += data[dofs++] = cs0;
            for (var i = 0; i < 32; ++i) {
                cs += data[dofs++] = sofs < mem.length ? mem[sofs++] : 0;
            }
            data[dofs++] = 0xff & cs;
        }
    }
    this.data = data;
    return this;
};

TapeFormat.prototype.count_bits = function(mem) {
    var nbits = mem.length * 8;
};

TapeFormat.prototype.ones_in_byte = function(b) {
    var count = 0;
    for (var i = 0; i < 8; ++i, b >>= 1) {
        count += b & 1;
    }
    return count;
};

TapeFormat.prototype.count_all_ones = function(mem) {
    var sum = 0;
    for (var i = 0; i < mem.length; ++i) {
        sum += this.ones_in_byte(mem[i]);
    }
    return sum;
};

/* ivagor's loadfm format
 * it's not using biphase encoding so everything here is different */
TapeFormat.prototype.v06c_loadfm = function(mem, org, name) {
    var flip = this.count_all_ones(mem) > this.count_bits(mem)/2 ? 255 : 0;

    var first_addr = 0xff & (org >> 8);
    var nblocks = Math.trunc((mem.length + 255) / 256);

    // 00..ff slow, bit 9 = fast
    var data = new Int16Array(256 + 4 + 11 + 2 + 255 + (2+256+2) * nblocks + 10);
    var dofs = 0;

    // preamble: 256 slow ffs
    for (var i = 0; i < 256; ++i) data[dofs++] = 0xff;
    data[dofs++] = 0xe6;
    data[dofs++] = 'F'.charCodeAt(0);
    data[dofs++] = 'M'.charCodeAt(0);
    data[dofs++] = '9'.charCodeAt(0);
    data[dofs++] = 5;

    // header:   11[filenameext] [first block addr] [block count]
    for (var i = 0; i < 11; ++i) data[dofs++] = name.charCodeAt(i) || 0x20;
    data[dofs++] = first_addr;
    data[dofs++] = nblocks;

    // preamble outro: 255 slow 0xff
    for (var i = 0; i < 255; ++i) data[dofs++] = 0xff;

    var cs = 0;

    // blocks
    var addr = 0;
    for (var block = 0; block < nblocks; ++block) {
        data[dofs++] = 0xff;
        data[dofs++] = 0xe6;
        for (var i = 0; i < 256; ++i) {
            var outval = 0xff & (flip ^ mem[addr++]);
            cs = 0xff & (cs + outval);
            data[dofs++] = 0x100 | outval;  // payload bytes are fastbytes
        }
    }
    data[dofs++] = cs;      // checksum
    data[dofs++] = flip;    // flip all bits

    return {
        data: data,
        invert: 0,
        sampleRate: this.sampleRate,

        fmbyte: function(octet, speeds) {
            var w = new Uint8Array(8 * 6 + 2);
            var wofs = 0;

            // SYNC
            w[wofs++] = w[wofs++] = this.invert * 255;
            this.invert ^= 1;

            // BYTE
            for (var i = 0; i < 8; ++i, octet <<= 1) {
                var msb = (octet & 0x80) >> 7;
                for (var q = 0; q < speeds[msb]; ++q) {
                    w[wofs++] = this.invert * 255;
                }
                this.invert ^= 1;
            }

            return w.slice(0, wofs);
        },

        makewav: function() {
            var encoded = new Uint8Array(this.data.length * 8 * 6);
            var eofs = 0;
            for (var i = 0; i < this.data.length; ++i) {
                var msg = this.data[i];
                var wave = new Uint8Array(0);
                var speed = (msg & 0x100) ? [2,5] : [3,6];
                wave = this.fmbyte(msg & 0xff, speed);

                for (var q = 0; q < wave.length; ++q) {
                    encoded[eofs++] = wave[q];
                }
            }
            encoded = encoded.slice(0, eofs);

            var params = {sampleRate: this.sampleRate, channels: 1};
            var wav = wavmodule.Wav(params);
            wav.setBuffer(encoded);
            var stream = wav.getBuffer(encoded.length + wav.getHeaderSize());
            return stream;
        }};
};

/* Vector-06C BASIC CAS
 * CAS is a pre-formatted BAS/MON/whatever file, only needs a preamble
 */
TapeFormat.prototype.v06c_cas = function(mem, org, name) {
    var data = new Uint8Array(mem.length + 257);
    var dofs = 0;
    for (var i = 0; i < 256; ++i) {
        data[dofs++] = 0;
    }
    data[dofs++] = 0xe6;
    for (var i = 0; i < mem.length; ++i, ++dofs) {
        data[dofs] = mem[i];
    }
    this.data = data;
    return this;
}

/* Vector-06C BASIC BAS
 * BAS needs to be wrapped in CAS container, then fed to v06c_cas
 */
TapeFormat.prototype.v06c_bas = function(mem, org, name) {
    if (name.length > 128) name = name.substring(0, 128);

    var data = new Uint8Array(4 + name.length + 3 + 256 + 5 + mem.length + 2);
    var dofs = 0;
    for (var i = 0; i < 4; ++i) data[dofs++] = 0xd3;
    for (var i = 0; i < name.length; ++i) data[dofs++] = name.charCodeAt(i);
    for (var i = 0; i < 3; ++i) data[dofs++] = 0;
    for (var i = 0; i < 256; ++i) data[dofs++] = 0x55;
    data[dofs++] = 0xe6;
    for (var i = 0; i < 3; ++i) data[dofs++] = 0xd3;
    data[dofs++] = 0;

    // payload
    var cs = 0;
    for (var i = 0; i < mem.length; ++i) {
        data[dofs++] = mem[i];
        cs = 0xffff & (cs + mem[i]);
    }
    data[dofs++] = cs & 0xff;
    data[dofs++] = (cs >> 8) & 0xff;

    return this.v06c_cas(data, 0, name);
}

TapeFormat.prototype.v06c_mon = function(mem, org, name) {
    if (name.length > 11) name = name.substring(0, 128);

    var data = new Uint8Array(4 + name.length + 3 + 256 + 1 + 4 +
        mem.length + 1);
    var dofs = 0;
    for (var i = 0; i < 4; ++i) data[dofs++] = 0xd2;
    for (var i = 0; i < name.length; ++i) data[dofs++] = name.charCodeAt(i);
    for (var i = 0; i < 3; ++i) data[dofs++] = 0;   // name terminator
    for (var i = 0; i < 256; ++i) data[dofs++] = 0; // payload preamble
    data[dofs++] = 0xe6;
    data[dofs++] = (org >> 8) & 0xff;               // big-endian load start
    data[dofs++] = org & 0xff;
    data[dofs++] = ((org + mem.length - 1) >> 8) & 0xff;// big-endian load end
    data[dofs++] = (org + mem.length - 1) & 0xff;

    var cs = 0;
    for (var i = 0; i < mem.length; ++i) {
        data[dofs++] = mem[i];
        cs = 0xff & (cs + mem[i]);
    }
    data[dofs++] = cs;

    return this.v06c_cas(data, 0, name);
}

/* EDASM text file format */
TapeFormat.prototype.v06c_edasm = function(mem, org, name) {
    var nibbler = function(b) {
        return ((b << 4) & 0xf0) | ((b >> 4) & 0x0f);
    };

    var data = new Uint8Array(200 + 5 + name.length + 256 + 1 + 2 +
        mem.length + 1 + 2);
    var dofs = 0;

    /* Preamble */
    for (var i = 0; i < 200; ++i) {
        data[dofs++] = ((Math.trunc(i / 25) % 2) === 0) ? 0x00 : 0x55;
    }

    for (var i = 0; i < 5; ++i) data[dofs++] = 0xe6;
    for (var i = 0; i < name.length; ++i) data[dofs++] = name.charCodeAt(i);
    for (var i = 0; i < 256; ++i) data[dofs++] = 0;
    data[dofs++] = 0xe6;

    var l = mem.length;
    data[dofs++] = nibbler(l & 0xff);
    data[dofs++] = nibbler((l >> 8) & 0xff);

    var fecksum = 0;
    for (var i = 0; i < mem.length; ++i) {
        data[dofs++] = mem[i];
        fecksum = 0xffff & (fecksum + mem[i]);
    }
    data[dofs++] = 0xff;
    data[dofs++] = fecksum & 0xff;
    data[dofs++] = (fecksum >> 8) & 0xff;

    this.data = data;
    return this;
}

TapeFormat.prototype.v06c_savedos = function(mem, org, name) {
    var data = new Uint8Array(mem.length + 256 + 1 + 4 + 1 + 12);

    var cs = 0;

    /* Preamble & sync */
    var dptr = 0;
    for (var i = 0; i < 256; ++i) {
        data[dptr++] = 0;
    }
    data[dptr++] = 0xe6;

    /* Start addr big-endian */
    data[dptr++] = (org >> 8) & 0xff;
    data[dptr++] = org & 0xff;
    /* End addr big-endian */
    data[dptr++] = ((org + mem.length - 1) >> 8) & 0xff;
    data[dptr++] = (org + mem.length - 1) & 0xff;

    for (var i = 0; i < mem.length; ++i) {
        let octet = mem[i];
        data[dptr++] = octet;
        cs = (cs + octet) & 0xff;
    }

    data[dptr++] = cs;

    var path = name.split(/[\\\/]/);
    var filename = path[path.length - 1].toUpperCase();
    var fext = filename.split('.');
    if (fext.length < 2) {
        fext.push("");
    }

    for (var i = 0; i < 8; ++i) cs += data[dptr++] = fext[0].charCodeAt(i) || 0x20;
    for (var i = 0; i < 3; ++i) cs += data[dptr++] = fext[1].charCodeAt(i) || 0x20;
    data[dptr++] = cs & 0xff;

    this.data = data;
    return this;
}

/* Krista: Vector-06c ugly sister.
 *
 * 256[55]
 */
TapeFormat.prototype.krista = function(mem, org, name) {
    var nblocks = Math.trunc((mem.length + 255) / 256);
    var data = new Uint8Array(200 + nblocks * 376 + 64);
    var dofs = 0;
    var sofs = 0;
    /* Preamble */
    for (var i = 0; i < 200; ++i) {
        data[dofs++] = ((Math.trunc(i / 25) % 2) === 0) ? 0x00 : 0x55;
    }

    var cs = 0;
    /* Header block */
    data[dofs++] = 0xe6;
    data[dofs++] = 0xff;
    var startblock = 0xff & (org >> 8);
    cs = data[dofs++] = startblock;
    cs += data[dofs++] = 0xff & (startblock + nblocks);
    data[dofs++] = cs;
    //data[dofs++] = data[dofs++] = 0;

    /* Blocks */
    for (var block = startblock; block < startblock + nblocks; ++block) {
        cs = 0;

        /* Block preamble */
        for (var i = 0; i < 16; ++i) data[dofs++] = 0x55;
        data[dofs++] = 0xE6;
        data[dofs++] = block; /* hi byte of block address */
        data[dofs++] = 0;     /* low byte of block address */
        data[dofs++] = 0;     /* payload size + 1 */

        /* Data: 256 octets */
        for (var i = 0; i < 256; ++i) {
            cs += data[dofs++] = sofs < mem.length ? mem[sofs++] : 0;
        }
        data[dofs++] = 0xff & cs;
    }
    this.data = data.slice(0, dofs + 16);
    return this;
};

/* Специалистъ:
 * <RAKK_256>,0E6H,0D9H,0D9H,0D9H,<ASCII_NAME>,
 * <RAKK_768>,0E6H,<ADR_BEG>,<ADR_END>,<BIN_CODE>,<CHECK_SUM>
 */
TapeFormat.prototype.specialist = function(mem, org, name) {
    var data = new Uint8Array(mem.length + 1024 + 32 + name.length);

    // rk-style checksum
    var cs_hi = 0;
    var cs_lo = 0;

    var dptr = 0;
    if (!this.forfile) {
        if (this.variant === "name-header") {
            for (var i = 0; i < 256; ++i) {
                data[dptr++] = 0;
            }
            data[dptr++] = 0xe6;
            data[dptr++] = 0xd9;
            data[dptr++] = 0xd9;
            data[dptr++] = 0xd9;

            for (var i = 0; i < name.length; ++i) {
                data[dptr++] = name.charCodeAt(i);
            }
        }

        for (var i = 0; i < 768; ++i) {
            data[dptr++] = 0;
        }
        data[dptr++] = 0xe6;
    }

    // same as .rk but little endian
    data[dptr++] = org & 0xff;
    data[dptr++] = (org >> 8) & 0xff;
    data[dptr++] = (org + mem.length - 1) & 0xff;
    data[dptr++] = ((org + mem.length - 1) >> 8) & 0xff;

    for (var i = 0; i < mem.length; ++i) {
        let octet = mem[i];
        data[dptr++] = octet;
        cs_lo += octet;
        if (i < mem.length - 1) {
            cs_hi += octet + ((cs_lo >> 8) & 0xff);
        }
        cs_lo &= 0xff;
    }

    //console.log('checksum=', Util.hex8(cs_hi&0377), Util.hex8(cs_lo&0377));

    /* rk86 checksum */
    data[dptr++] = cs_lo & 0xff;
    data[dptr++] = cs_hi & 0xff;

    var end = dptr;

    for (var i = dptr; i < mem.length; ++i) {
        mem[i] = 0;
    }

    if (this.forfile) {
        this.data = data.slice(0, end);
    } else {
        this.data = data;
    }

    return this;
};


module.exports = {
    TapeFormat: function(fmt, forfile, konst, leader, sampleRate) {
        return new TapeFormat(fmt, forfile, konst, leader, sampleRate);
    }
};


