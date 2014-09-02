Warden.js
=========

Маленькая декларативная библиотека для EventDrivenDevelopment

Warden.js предоставляет методологию для разработки реактивных EDD приложений в функциональной парадигме. В нем есть минимальный набор нужных инструментов для создания Pub/Sub обертки над вашими объектами и конструкторами, создания потоков данных, их обработки и связывания данных с отображением. Библиотека весит меньше 10 Kb в сжатом виде, и предоставляет вменяемое API для расширения и добавления всех нужных вам методов. Warden.js - хороший способ избавиться от ужасов асинхронной обработки событий и коллбэков и начать писать в декларативном стиле. Вы можете пользоваться Warden.js в любой среде, как в браузере так и на сервере. 

Что хорошего в Warden.js?
 - Никаких зависимостей
 - Легковесность: (<10 Kb)
 - Расширяемость и конфигурируемость

Что плохого?
 - Библиотека сырая
 - Неполноценная реализация FRP
 - Минимальное количество готовых решений под популярные платформы

<img src="https://raw.githubusercontent.com/zefirka/Warden.js/master/src/warden.png" align="right" width="301px" style='z-index: 32323; position: relative;'/>

В комплекте:
 - Расширение, реализующее Pub/Sub-паттерн для любых объектов и конструкторов, позволяющее публиковать и прослушивать любые пользовательские события.
 - Потоки данных. Данные которые могу браться откуда угодно: таймеры, ответы с сервера, пользовательские события, события веб-сокетов и т.д.
 - Обработка шин потоков, - декларативный стиль обработки данных избавляющий от необходимости писать вложенные коллбэки и отслеживать внешнее состояние системы.
 - Связывание данных с отображением. Единожды связав данные с отображением вы больше не волнуетесь за актуальность данных и обновление отображения.

##Модули##

###Warden.extend###
Модуль [`.extend`](#) расширяет заданный объект (или конструктор объектов) методами [`.emit()`](#) (или [`.$emit()`](#), если [`emit`] уже занят), [`.listen()`](#) и [`.stream()`](#), которые реализуют обычный Pub/Sub паттерн. 

###Warden.extend###
```js
function Clicker(){
	...
}
Warden.extend(Clicker);
```
or
```js
var module = Warden.extend({
  fire: function(){
    this.emit({
      type: "custom"
    });
  }
});
```
or even
```js
Warden.extend($)
```
После чего все эти объекты поддерживают методы Pub/Sub паттерна

```js
var obj = new Clicker();
x.listen('eventType', function(event){
	console.log(event);
})

module.stream('custom').log();

$(".cssClass").stream('mouseover').log();
```

###Warden.makeStream###
Модуль [`.makeStream`](#) позволяет создавать потоки данных,