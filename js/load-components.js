// Загрузка header и footer компонентов
document.addEventListener('DOMContentLoaded', async function() {
  // Загружаем header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    try {
      const response = await fetch('includes/header.html');
      const html = await response.text();
      headerPlaceholder.outerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки header:', error);
    }
  }

  // Загружаем footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    try {
      const response = await fetch('includes/footer.html?v=' + Date.now());
      const html = await response.text();
      footerPlaceholder.outerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки footer:', error);
    }
  }
});
