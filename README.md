bin2wav для древних 8-битных ПК из СССР
=======================================

С помощью этой утилиты можно сделать WAV файл для загрузки 
с магнитофонного входа в компьютеры Вектор-06ц, Криста-2, Радио-86РК, 
Микроша, Партнер, Специалист. 

Для установки в системе:

$ npm install -g

Утилита будет доступна под названием bin2wav. bin2wav -h покажет справку.

Альтернативно можно просто запустить ./bin2wav.js

Исполняемый файл для Windows получается с помощью nexe. Ссылка: https://github.com/svofski/bin2wav/releases/latest


Форматы данных
--------------
  |    |    |
  |---------------|-------|
  | rk-bin          | Радио 86РК              |
  | mikrosha-bin    | Микроша                 |  
|partner-bin     |Партнер |
|v06c-rom        |Вектор-06ц ROM/R0M/VEC |
|v06c-cas        |Вектор-06ц CAS |
|v06c-bas        |Вектор-06ц BAS |
|v06c-mon        |Вектор-06ц MON |
|v06c-edasm      |Вектор-06ц EDASM |
|v06c-savedos    |Вектор-06ц SAVEDOS |
|v06c-loadfm     |Вектор-06ц loadfm by ivagor |
|v06c-turbo      |Вектор-06ц loadfm by ivagor с автоматическим загрузчиком |
|krista-rom      |Криста-2 |
|specialist-rks  |Специалист .RKS |
|specialist-mon  |Специалист .MON |
