;Иван Городецкий, Уфа, 2016
; Адаптация для использования при подключенном ПЗУ загрузчика и автозагрузкой
; Вячеслав Славинский, С.-Петербург, 2020

; Этот загрузчик размещается начиная с адреса $db00, прямо в экранном ОЗУ
; стандартного загрузчика и осуществляет перехват управления на себя.
;
; Особые зоны:  DBA8..DBB2 - столбик (см. Around1)
;               DCA8..DCB2 - столбик (см. Around2)
;               DCEA..     - здесь находится переписанное содержимое стека

                .project loadfm-db00
                ;.tape v06c-rom

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
		
		
		jmp     Restart
		
;;; релокашки	
WaitSync:
		mvi e,0
		in 01
		mov d,a		
WaitSyncLoop:		
		call GetBitSlow
		mov a,e
		adc a
		mov e,a
		cpi 0E6h
		jnz WaitSyncLoop
		ret
;;;
GetByte:
		push b
		in 01
		cmp d
		jz $-3
		mov d,a
		xthl\ xthl
		call GetBitSlow\ mov a,a;  \ adc a\ mov e,a
		call GetBitSlowY;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX;\ mov a,e\ adc a\ mov e,a
		call GetBitSlowX\ mov a,e\ adc a
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
		jz  Level1_
		mov d,a
		mvi a,05h
		cmp b
		ret
;;;
		
Restart:
		lxi	h,0E000h
		sphl
		xra	a
ClrScr:
		mov	m,a
		inx	h
		cmp	h
		jnz	ClrScr

ResetRead:
		;mvi e,00h
		call WaitSync
		call GetByte
		cpi 'F'
		jnz ResetRead
		call GetByte
		cpi 'M'
		jnz ResetRead
		call GetByte
		cpi '9'
		jnz ResetRead
		call GetByte
		sta GetBlock+2
		mvi c,11
GetName:
                jmp Around1
                db 0,0
                db 0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0x81,0x81
Around1:
		call GetByte
		dcr c
		jnz GetName
		call GetByte		;Первый блок
		ora a
		jz ResetRead
;		inr a
		mov l,a
		mvi h,0FEh
		mov m,h
		call GetByte		;Число блоков
		mov b,a
		add l
		dcr a
		mov c,l
		mov l,a
		mov m,h
		mov h,c
		xra a
		sta SetCSUM+1
		mov l,a
		mov c,a
		push b
		push h
GetBlock:
		push b
		mvi c,0 ; VAR!
		call WaitSync
GetBlockLoop:
		in 01
		cmp d
		jz $-3
		mov d,a
		;nop\ nop\ nop\ nop
		;nop\ nop\ nop\ nop
		mov d, a ; a slow nop

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,a\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a\ mov e,a		

		mvi b,0\ inr b\ in 01\ cmp d
		jz $-4
		mov d,a\ mov a,c\ cmp b
		mov a,e\ adc a

		mov m,a
SetCSUM:
		;mvi e,0
		;add e
		adi 0
		sta SetCSUM+1		
		inr l
		jnz GetBlockLoop
		mov l,h
		mvi h,0FFh
		mov m,h
		mov h,l
		inr h
		mvi l,0
		pop b
		dcr b
		jnz GetBlock
;
		call GetByte	;контрольная сумма
		mov c,a
		lda SetCSUM+1
		cmp c
		jnz Restart
		call GetByte	;маска инверсии
		pop h
		pop b
		ora a
                
                ; переход на hl (обычно $100)
		mvi a, $c3
		sta 0
		shld 1

		jz NoMask
Mask:
Mov1:
		mov a,m
		cma
		mov m,a
		inx h
		dcr c
		jnz Mov1
		dcr b
		jp Mov1
NoMask:
                mvi a, 3
                out 0
                ei
                mvi a, $08
RusLat:         mvi b, 0
                xri $8
                jmp Around2
                db 0xff,0x00,0xff,0xff,0xff,0xff,0xff,0xff,0x81,0x81        
Around2:
                out $1
BlinkWait       
                lxi h,0 
BlinkWait2
                dcr l
                jnz BlinkWait2
                dcr h
                jp BlinkWait2
                dcr b
                jnz BlinkWait
                jmp RusLat
                
                ; 36 пустых байт, вах!
		
		.org $dcea
		dw $db00,$0101,hook,hook,hook
		dw hook
		dw hook
		dw hook
		dw hook
		dw hook
		dw hook

		.end	

