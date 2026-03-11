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
      const response = await fetch('includes/footer.html?v=5');
      const html = await response.text();
      footerPlaceholder.outerHTML = html;
      
      // После загрузки footer, инициализируем VK icon hover
      initVKIconHover();
    } catch (error) {
      console.error('Ошибка загрузки footer:', error);
    }
  }
});

// VK icon hover color change
function initVKIconHover() {
  const vkLinks = document.querySelectorAll('.footer-vk-link');
  
  vkLinks.forEach(link => {
    const icon = link.querySelector('.footer-vk-icon');
    if (!icon) return;
    
    // Store original color
    const originalColor = '#707F9A';
    const hoverColor = '#F16664';
    
    link.addEventListener('mouseenter', () => {
      const paths = icon.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', hoverColor);
      });
    });
    
    link.addEventListener('mouseleave', () => {
      const paths = icon.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', originalColor);
      });
    });
  });
}
