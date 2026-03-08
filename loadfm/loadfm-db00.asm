R;Иван Городецкий, Уфа, 2016
; Адаптация для использования при подключенном ПЗУ загрузчика и автозагрузкой
; Вячеслав Славинский, С.-Петербург, 2020

; Этот загрузчик размещается начиная с адреса $db00, прямо в экранном ОЗУ
; стандартного загрузчика и осуществляет перехват управления на себя.
;
; Особые зоны:  DBA8..DBB2 - столбик (см. Around1)
;               DCA8..DCB2 - столбик (см. Around2)
;               DCEA..     - здесь находится переписанное содержимое стека

; 08.03.2026 добавлено перемещение загрузчика в адреса $fc00, максимальный
;            размер загружаемой программы 64240 байт

                .project loadfm-db00
                ;.tape v06c-rom

OFFSET          .equ $2100

col             equ 173

		.org	0db00h
hook
                mvi     a, $c9
                sta     $38
		ei
		hlt

colorset:
		mvi	a, 88h
		out	0
		lxi     b, 15
colorset1:	mov	a, c
		out	2
		mov	a, b
		xri     col
		out	0Ch
		mov     b, a
		out	0Ch
		out	0Ch
		dcr	c
		out	0Ch
		out	0Ch
		out	0Ch
		jp	colorset1
		mvi	a,255
		out	3
		
		jmp     Restart0
		
;;; релокашки	
WaitSync:
		mvi e,0
		in 01
		mov d,a		
WaitSyncLoop:		
		call GetBitSlow + OFFSET
		mov a,e
		adc a
		mov e,a
		cpi 0E6h
		jnz WaitSyncLoop + OFFSET
		ret
;;;
GetByte:
		push b
		in 01
		cmp d
		jz $-3
		mov d,a
		xthl\ xthl
		call GetBitSlow + OFFSET\ mov a,a;  \ adc a\ mov e,a
		call GetBitSlowY + OFFSET;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX + OFFSET;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX + OFFSET;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX + OFFSET;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX + OFFSET;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX + OFFSET;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX + OFFSET\ mov a,e\ adc a
		pop b
		ret
GetBitSlowX:    mov a, e
GetBitSlowY:    adc a
                mov e, a
GetBitSlow:     mvi b,0
Level1_
		inr b
		in 01
		cmp d
		jz  Level1_ + OFFSET
		mov d,a
		mvi a,05h
		cmp b
		ret
;;;
		
Restart:
		lxi	h,0fe00h        ; TODO: nice clear screen
		;sphl
		nop
		xra	a
ClrScr:
		mov	m,a
		inx	h
		cmp	h
		jnz	ClrScr + OFFSET

ResetRead:
		;mvi e,00h
		call WaitSync + OFFSET
		call GetByte + OFFSET
		cpi 'F'
		jnz ResetRead + OFFSET
		call GetByte + OFFSET
		cpi 'M'
		jnz ResetRead + OFFSET
		call GetByte + OFFSET
		cpi '9'
		jnz ResetRead + OFFSET
		call GetByte + OFFSET
		sta GetBlock+2 + OFFSET
		mvi c,11
GetName:
                jmp Around1 + OFFSET
                db 0,0
                db 0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0x81,0x81
Around1:
		call GetByte + OFFSET
		dcr c
		jnz GetName + OFFSET
		call GetByte + OFFSET	;Первый блок
		ora a
		jz ResetRead + OFFSET
;		inr a
		mov l,a
		mvi h,0FEh
		mov m,h
		call GetByte + OFFSET		;Число блоков
		mov b,a
		add l
		dcr a
		mov c,l
		mov l,a
		mov m,h
		mov h,c
		xra a
		sta SetCSUM+1 + OFFSET
		mov l,a
		mov c,a
		push b
		push h
GetBlock:
		push b
		mvi c,0 ; VAR!
		call WaitSync + OFFSET
GetBlockLoop:
		in 01
		cmp d
		jz $-3 + OFFSET
		mov d,a
		;nop\ nop\ nop\ nop
		;nop\ nop\ nop\ nop
		mov d, a ; a slow nop

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,a\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a		

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4 + OFFSET
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a

		mov m,a
SetCSUM:
		;mvi e,0
		;add e
		adi 0
		sta SetCSUM+1 + OFFSET		
		inr l
		jnz GetBlockLoop + OFFSET
		mov l,h
		mvi h,0FFh
		mov m,h
		mov h,l
		inr h
		mvi l,0
		pop b
		dcr b
		jnz GetBlock + OFFSET
;
		call GetByte + OFFSET	;контрольная сумма
		mov c,a
		lda SetCSUM+1 + OFFSET
		cmp c
		jnz Restart + OFFSET
		call GetByte + OFFSET	;маска инверсии
		pop h
		pop b
		ora a
                
                ; переход на hl (обычно $100)
		mvi a, $c3
		sta 0
		shld 1

		jz NoMask + OFFSET
Mask:
Mov1:
		mov a,m
		cma
		mov m,a
		inx h
		dcr c
		jnz Mov1 + OFFSET
		dcr b
		jnz Mov1 + OFFSET    ; начинаем с b > 0 (счетчик блоков)
NoMask:
                mvi a, 3
                out 0
                ei
                mvi a, $08
RusLat:         mvi b, 0
                xri $8
                jmp Around2 + OFFSET
                db 0xff,0x00,0xff,0xff,0xff,0xff,0xff,0xff,0x81,0x81        
Around2:
                out $1
BlinkWait       
                lxi h,0 
BlinkWait2
                dcr l
                jnz BlinkWait2 + OFFSET
                dcr h
                jp BlinkWait2 + OFFSET
                dcr b
                jnz BlinkWait + OFFSET
                jmp RusLat + OFFSET
                
                ; initial intercept, move everything to $fb00
Restart0:
                lxi d, $db00
                lxi h, $db00 + OFFSET
                sphl
copyup_lup:        
                ldax d \ inx d \ mov m, a \ inx h
                ;mov a, m \ inx h \ stax d \ inx d
                mvi a, ($db00 + OFFSET + $200) >> 8
                cmp h
                jnz copyup_lup
                jmp Restart + OFFSET
		
		.org $dcea
		dw $db00,$0101,hook,hook,hook
		dw hook
		dw hook
		dw hook
		dw hook
		dw hook
		dw hook

		.end	

