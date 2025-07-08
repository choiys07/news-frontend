    // Render에서 배포된 백엔드 주소로 변경하세요
    const API_BASE = 'https://live-news-arjv.onrender.com';

    const container = document.getElementById('news-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const statusDiv = document.getElementById('status');

    let isLoading = false;

    // 상태 업데이트 함수
    function updateStatus(message, type = 'info') {
      statusDiv.textContent = message;
      statusDiv.className = `status ${type}`;
    }

    // 로딩 상태 토글
    function toggleLoading(loading) {
      isLoading = loading;
      const btnText = refreshBtn.querySelector('.btn-text') || refreshBtn;
      
      if (loading) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<div class="loading-spinner"></div>새로고침 중...';
      } else {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span class="btn-text">새로고침</span>';
      }
    }

    // 에러 상태 표시
    function showError(message) {
      container.innerHTML = `
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3>오류가 발생했습니다</h3>
          <p>${message}</p>
          <button class="retry-btn" onclick="fetchNews()">다시 시도</button>
        </div>
      `;
    }

    // 빈 상태 표시
    function showEmpty() {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <h3>뉴스가 없습니다</h3>
          <p>현재 표시할 뉴스가 없습니다. 잠시 후 다시 시도해주세요.</p>
        </div>
      `;
    }

    // 뉴스 아이템 생성
    function createNewsItem(item) {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <div class="news-source">${item.source}</div>
        <a href="${item.link}" target="_blank" class="news-title">${item.title}</a>
        <button class="summary-btn" data-url="${item.link}">
          <span class="btn-text">요약 보기</span>
        </button>
        <div class="summary"></div>
      `;

      // 요약 버튼 클릭 이벤트
      const summaryBtn = div.querySelector('.summary-btn');
      const summaryDiv = div.querySelector('.summary');

      summaryBtn.addEventListener('click', async () => {
        const url = summaryBtn.getAttribute('data-url');
        
        if (summaryDiv.classList.contains('show')) {
          summaryDiv.classList.remove('show');
          summaryBtn.innerHTML = '<span class="btn-text">요약 보기</span>';
          return;
        }

        summaryBtn.disabled = true;
        summaryBtn.innerHTML = '<div class="loading-spinner"></div>요약 중...';
        summaryDiv.textContent = '';

        try {
          const summaryRes = await fetch(`${API_BASE}/summarizer?url=${encodeURIComponent(url)}`);
          
          if (!summaryRes.ok) {
            throw new Error(`HTTP ${summaryRes.status}: ${summaryRes.statusText}`);
          }

          const summaryData = await summaryRes.json();
          
          if (summaryData.summary) {
            summaryDiv.textContent = summaryData.summary;
            summaryDiv.classList.add('show');
            summaryBtn.innerHTML = '<span class="btn-text">요약 숨기기</span>';
          } else {
            summaryDiv.textContent = '요약을 생성할 수 없습니다.';
            summaryDiv.classList.add('show');
            summaryBtn.innerHTML = '<span class="btn-text">요약 보기</span>';
          }
        } catch (error) {
          console.error('요약 오류:', error);
          summaryDiv.textContent = '요약을 불러오는 중 오류가 발생했습니다.';
          summaryDiv.classList.add('show');
          summaryBtn.innerHTML = '<span class="btn-text">요약 보기</span>';
        } finally {
          summaryBtn.disabled = false;
        }
      });

      return div;
    }

    // 뉴스 목록 불러오기
    async function fetchNews() {
      if (isLoading) return;

      toggleLoading(true);
      updateStatus('뉴스를 불러오는 중...');

      try {
        const res = await fetch(`${API_BASE}/newsCrawler/crawler`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          showEmpty();
          updateStatus('뉴스가 없습니다', 'error');
          return;
        }

        // 컨테이너 초기화
        container.innerHTML = '';

        // 뉴스 아이템 생성 및 추가
        data.forEach(item => {
          if (item.title && item.link && item.source) {
            container.appendChild(createNewsItem(item));
          }
        });

        updateStatus(`${data.length}개의 뉴스를 불러왔습니다`, 'success');

      } catch (error) {
        console.error('뉴스 fetch 오류:', error);
        showError('뉴스를 불러오는 중 오류가 발생했습니다.');
        updateStatus('뉴스 로딩 실패', 'error');
      } finally {
        toggleLoading(false);
      }
    }

    // 새로고침 버튼 이벤트
    refreshBtn.addEventListener('click', fetchNews);

    // 자동 새로고침 (5분마다)
    setInterval(fetchNews, 300000);

    // 초기 로딩
    fetchNews();