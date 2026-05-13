// Система унифицированных уведомлений

class AppNotification {
  /**
   * Показать модальное окно
   * @param {string} title - Заголовок
   * @param {string} message - Сообщение
   * @param {string} type - Тип: 'success', 'error', 'warning', 'info'
   * @param {array} buttons - Массив кнопок [{text: 'OK', action: callback, type: 'primary'}]
   */
  static modal(title, message, type = 'info', buttons = []) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    let html = `
      <div class="modal-icon ${type}">${icons[type]}</div>
      <h2 class="modal-title">${title}</h2>
      <p class="modal-description">${message}</p>
    `;

    if (buttons.length === 0) {
      buttons = [{ text: 'OK', type: 'primary' }];
    }

    html += '<div class="modal-buttons">';
    buttons.forEach(btn => {
      const btnType = btn.type || 'primary';
      html += `<button class="modal-btn modal-btn-${btnType}" data-action="${buttons.indexOf(btn)}">${btn.text}</button>`;
    });
    html += '</div>';

    dialog.innerHTML = html;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Обработчики кнопок
    dialog.querySelectorAll('button').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (buttons[index].action) {
          buttons[index].action();
        }
        overlay.remove();
      });
    });

    // Закрытие по клику на фон
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    return overlay;
  }

  /**
   * Показать успешное уведомление
   */
  static success(title, message, buttons = []) {
    return this.modal(title, message, 'success', buttons);
  }

  /**
   * Показать ошибку
   */
  static error(title, message, buttons = []) {
    return this.modal(title, message, 'error', buttons);
  }

  /**
   * Показать предупреждение
   */
  static warning(title, message, buttons = []) {
    return this.modal(title, message, 'warning', buttons);
  }

  /**
   * Показать информацию
   */
  static info(title, message, buttons = []) {
    return this.modal(title, message, 'info', buttons);
  }

  /**
   * Показать всплывающее уведомление (тост)
   * @param {string} message - Сообщение
   * @param {string} type - Тип: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Время показа в мс (0 = не закрывается)
   */
  static toast(message, type = 'info', duration = 3000) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">✕</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const remove = () => {
      toast.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    };

    closeBtn.addEventListener('click', remove);

    if (duration > 0) {
      setTimeout(remove, duration);
    }

    return toast;
  }

  /**
   * Показать успешный тост
   */
  static toastSuccess(message, duration = 3000) {
    return this.toast(message, 'success', duration);
  }

  /**
   * Показать ошибку в тосте
   */
  static toastError(message, duration = 3000) {
    return this.toast(message, 'error', duration);
  }

  /**
   * Показать предупреждение в тосте
   */
  static toastWarning(message, duration = 3000) {
    return this.toast(message, 'warning', duration);
  }

  /**
   * Показать информацию в тосте
   */
  static toastInfo(message, duration = 3000) {
    return this.toast(message, 'info', duration);
  }

  /**
   * Подтверждение действия
   */
  static confirm(title, message, onConfirm, onCancel = null) {
    return this.modal(title, message, 'warning', [
      {
        text: 'Отмена',
        action: onCancel,
        type: 'secondary'
      },
      {
        text: 'Подтвердить',
        action: onConfirm,
        type: 'danger'
      }
    ]);
  }
}

// Примеры использования:
// AppNotification.success('Успешно!', 'Товар добавлен в корзину!');
// AppNotification.error('Ошибка', 'Не удалось добавить товар');
// AppNotification.toastSuccess('Товар добавлен в корзину!');
// AppNotification.confirm('Удалить?', 'Вы уверены?', () => console.log('Удалено'), () => console.log('Отменено'));