import { ThinkingRoomApp } from './thinkingRoomApp';

const container = document.createElement('div');
container.id = 'app';
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(container);

const app = new ThinkingRoomApp(container, {
  enableMicrophone: false,
  enableWebcam: false
});
app.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => app.dispose());
}
