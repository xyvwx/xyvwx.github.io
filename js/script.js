// 移动端菜单切换
document.getElementById('menuToggle').addEventListener('click', function() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.toggle('hidden');
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    // 关闭移动端菜单（如果打开）
    document.getElementById('mobileMenu').classList.add('hidden');
    
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// 碎碎念功能
document.getElementById('post-chatter').addEventListener('click', function() {
  const input = document.getElementById('new-chatter');
  const content = input.value.trim();
  
  if (content) {
    const container = document.getElementById('chatter-container');
    
    // 获取当前日期
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
    
    // 创建新的碎碎念元素
    const newChatter = document.createElement('div');
    newChatter.className = 'bg-light-pink p-5 rounded-lg shadow-sm mb-4 card-hover';
    newChatter.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h3 class="font-semibold">今日碎碎念</h3>
        <span class="text-sm text-gray-500">${dateStr}</span>
      </div>
      <p class="text-gray-700">${content}</p>
    `;
    
    // 添加到容器顶部
    container.appendChild(newChatter);
    
    // 添加动画效果
    newChatter.style.transform = 'translateY(10px)';
    newChatter.style.opacity = '0';
    setTimeout(() => {
      newChatter.style.transition = 'all 0.5s ease';
      newChatter.style.transform = 'translateY(0)';
      newChatter.style.opacity = '1';
    }, 10);
    
    // 清空输入框
    input.value = '';
    
    // 显示成功提示
    alert('碎碎念发布成功！');
  } else {
    alert('请输入内容后再发布！');
  }
});
