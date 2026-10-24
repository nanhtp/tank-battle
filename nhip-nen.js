'use strict';

// Chỉ phát nhịp; trạng thái trận và AI vẫn được xử lý tại game.js.
// Luồng nền không phụ thuộc requestAnimationFrame khi tab bị ẩn.
setInterval(() => postMessage('nhip'), 100);
