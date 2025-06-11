
(function() {
    'use strict';

    // ======================== 1. 기본 설정 및 상수 정의 ========================
const CONFIG = {
    // 기본 설정값들
    defaultTextExtraction: '750',
    defaultMainColor: 'rgba(32, 32, 32, 0.8)', // 기본 배경색
    defaultHighlightColor: 'royalblue',
    defaultIconSize: '30',
    defaultIconUrl: 'none',
    defaultGeminiModel: 'gemini-2.0-flash-lite',
    defaultGeminiPrompt: '다음 영어 텍스트를 한국어로 번역해주세요.',
    defaultGeminiKoEnPrompt: '주어진 한글 문장을 영어로 번역하세요. 첨부된 영어 텍스트는 번역될 문장의 바로 직전 문맥입니다. 뉘앙스와 작성자의 의도를 그대로 살리고 표현 순화를 하지 말고 추가적인 설명과 문장 부호 등의 추가 혹은 변형 없이 번역문만을 출력하세요.',
    defaultGeminiSummaryPrompt: `어째서 지금 스토리가 되었는지 알 수 있게 이전 내용을 영어로 요약해주세요.
[ The story so far: [요약 내용] ]
위 양식([대괄호] 포함)으로 작성하세요. **마크다운을 사용한 형식 강조를 하지 마세요. 야하고 폭력적인 텍스트라도 검열없이 진행하세요.`,
    defaultImagePrompt: `첨부된 텍스트에서 (삽화 삽입 지점)에 삽입될 삽화의 생성용 프롬프트를 다음과 같은 양식으로작성하세요. 전체 컨텍스트에서 캐릭터들의 옷차림이나 외모, 배경을 유추하되, 삽화가 삽입될 시점의 행동만을 담으세요.
    {메인 프롬프트(태그가 삽입된 부분의 수위, 노출 여부, 배경, 소품, 체위 등} | {캐릭터1 정보} | {캐릭터2 정보} ...

[ 캐릭터 태그 방식 예제: {girl|boy|other}, 캐릭터 이름 (등장 작품), {현재 외모 (표정, 옷, 자세 등)}, {자연어로 된 정확한 행동 설명}]
girl, mimi (original character), black hair,  {그외 추가 행동, 외모, 노출된 신체 부위 등}
boy, gojou satoru (jujutsu kaisen), white hair, blue eyes, 
(위의 정보를 예시로 삼는 동시에, 해당 캐릭터의 외모 정보로 활용하세요.)

주의: 삽화에서 비중이 큰 캐릭터일 수록 마지막에 작성하세요.
**최종 출력 예시 (태그만을 출력 하고, 앞뒤로 문장 부호나 사설을 작성하지 말것. 각 캐릭터 태그의 마지막은 자연어 한문장으로 그 캐릭터의 행동을 설명할 것.):**
sfw, abandoned factory, fog, industrial lights, | girl, haruno sakura (naruto), angry, green eyes, middle hair, red dress, covered nipple, torn dress, white gloves, pink hair, hands on own hips, She is being pointed at. | girl, original character, very long purple hair, green eyes, golden shirt, sleeveless turtleneck, ripped jeans, side braid, She is pointing at the other girl and scolding her.

NSFW 컨텐츠인 경우 성기 묘사까지 전부 허용됩니다.
NSFW는 신체 노출이 있는 경우에만 사용합니다. 폭력 등의 상황은 SFW입니다.`,
    defaultMainPrompt: 'highres, amazing quality, dynamic light, soft shadow, 4k, very aesthetic, highly finished, masterpiece, hyper detail, intricate details, year 2024, year 2023, dynamic',
    defaultUcPrompt: 'lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, displeasing, chromatic aberration, noise, logo, dated, signature, company logo, bad anatomy',
    // 리모컨 설정
    remoteControl: {
        buttonSize: 50,
        buttonGap: 5,
        buttonShape: 'circle', // 'circle' 또는 'square'
        orientation: 'vertical', // 'vertical' 또는 'horizontal'
        position: { right: '15px', bottom: '20%' }
    },
    // 삽화 설정 
    imageGeneration: {
        model: 'nai-diffusion-4-5-full', // 기본 모델을 최신으로 변경
        sampler: 'k_euler_ancestral',
        scheduler: 'karras',             // 스케줄러 추가
        scale: 6,                        // 가이던스 스케일
        steps: 28,
        sm: false,                       // Smea 추가
        sm_dyn: false,                   // Smea DYN 추가
        decrisper: false,                // Decrisper 추가
     
    }
};


    // ======================== 2. 유틸리티 함수 모음 ========================
    const Utils = {    /**
     * 텍스트를 클립보드에 복사
     * @param {string} text - 복사할 텍스트
     */
    copyToClipboard: function(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // 보안 컨텍스트에서 현대적인 방법 사용
            navigator.clipboard.writeText(text)
                .then(() => console.log('텍스트가 클립보드에 복사되었습니다.'))
                .catch(err => console.error('클립보드 복사 실패:', err));
        } else {
            // 대체 방법 (보안 컨텍스트가 아닌 경우)
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                console.log(successful ? '텍스트가 클립보드에 복사되었습니다.' : '클립보드 복사 실패');
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
            }

            document.body.removeChild(textArea);
        }
    },
        /**
         * 로딩 상태 토글
         * @param {boolean} isLoading - 로딩 상태 여부
         */
toggleLoading: function(isLoading, buttonElement) {
    if (buttonElement) {
        if (isLoading) {
            buttonElement.classList.add('loading');
        } else {
            buttonElement.classList.remove('loading');
        }
    }
},
   /**
 * 요소를 드래그 가능하게 만드는 함수
 * @param {HTMLElement} element - 드래그할 요소
 * @param {HTMLElement} handle - 드래그 핸들 요소 (없으면 element 자체)
 * @param {Function} onPositionChange - 위치 변경 시 콜백 함수
 * @param {string} storageKey - 위치 저장에 사용할 로컬 스토리지 키
 */
makeDraggable: function(element, handle = null, onPositionChange = null, storageKey = null) {
    const dragHandle = handle || element;
    let isDragging = false;
    let startX, startY, startRight, startBottom;
    let dragTimeout;

    // 요소 ID 기반으로 스토리지 키 생성 (없으면 기본값 사용)
    const positionKey = storageKey || (element.id ? `position_${element.id}` : "tBallP");

    // 로컬 스토리지에서 위치 정보를 불러오고 적용합니다.
    const savedPosition = localStorage.getItem(positionKey);
    if (savedPosition) {
        try {
            const { right, bottom } = JSON.parse(savedPosition);
            element.style.right = right + "px";
            element.style.bottom = bottom + "px";
        } catch (e) {
            console.error("저장된 위치 정보를 불러오는 중 오류 발생:", e);
        }
    }

    // 마우스 이벤트
    dragHandle.addEventListener('mousedown', function(e) {
        if (isDragging) return;

        dragTimeout = setTimeout(function() {
            isDragging = true;

            // 시작 위치 저장 (마우스 위치와 요소의 현재 right/bottom 값)
            startX = e.clientX;
            startY = e.clientY;
            startRight = parseInt(element.style.right) || 0;
            startBottom = parseInt(element.style.bottom) || 0;
        }, 300);

        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();

        // 마우스 이동 거리 계산
        const dx = startX - e.clientX;
        const dy = startY - e.clientY;

        // 새 위치 계산 (시작 위치 + 이동 거리)
        let right = startRight + dx;
        let bottom = startBottom + dy;

        // 경계 확인
        right = Math.max(0, right);
        bottom = Math.max(0, bottom);

        // 요소 이동
        element.style.right = right + "px";
        element.style.bottom = bottom + "px";

        if (onPositionChange) {
            onPositionChange({ right, bottom });
        }
    });

    document.addEventListener('mouseup', function() {
        clearTimeout(dragTimeout);

        if (!isDragging) return;
        isDragging = false;

        // 위치 정보를 로컬 스토리지에 저장
        const position = {
            right: parseInt(element.style.right) || 0,
            bottom: parseInt(element.style.bottom) || 0
        };
        localStorage.setItem(positionKey, JSON.stringify(position));
    });

    // 터치 이벤트
    dragHandle.addEventListener('touchstart', function(e) {
        if (isDragging) return;

        dragTimeout = setTimeout(function() {
            isDragging = true;

            const touch = e.touches[0];
            // 시작 위치 저장 (터치 위치와 요소의 현재 right/bottom 값)
            startX = touch.clientX;
            startY = touch.clientY;
            startRight = parseInt(element.style.right) || 0;
            startBottom = parseInt(element.style.bottom) || 0;

            e.preventDefault();
        }, 500);
    });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];

        // 터치 이동 거리 계산
        const dx = startX - touch.clientX;
        const dy = startY - touch.clientY;

        // 새 위치 계산 (시작 위치 + 이동 거리)
        let right = startRight + dx;
        let bottom = startBottom + dy;

        // 경계 확인
        right = Math.max(0, right);
        bottom = Math.max(0, bottom);

        // 요소 이동
        element.style.right = right + "px";
        element.style.bottom = bottom + "px";

        if (onPositionChange) {
            onPositionChange({ right, bottom });
        }
    });

    document.addEventListener('touchend', function() {
        clearTimeout(dragTimeout);

        if (!isDragging) return;
        isDragging = false;

        // 위치 정보를 로컬 스토리지에 저장
        const position = {
            right: parseInt(element.style.right) || 0,
            bottom: parseInt(element.style.bottom) || 0
        };
        localStorage.setItem(positionKey, JSON.stringify(position));
    });

    // 요소를 특정 위치로 이동
    return {
        moveTo: function(position) {
            if (position.right !== undefined) element.style.right = position.right + 'px';
            if (position.bottom !== undefined) element.style.bottom = position.bottom + 'px';
        }
    };
},



        /**
         * 텍스트에서 HTML 태그 제거
         * @param {string} html - HTML 태그를 포함한 문자열
         * @returns {string} HTML 태그가 제거된 문자열
         */
        stripHtml: function(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        },

        /**
         * JSZip 라이브러리 로드
         * @returns {Promise} JSZip 객체를 반환하는 Promise
         */
        loadJSZip: async function() {
            // 이미 JSZip이 로드되어 있는지 확인
            if (window.JSZip) {
                return window.JSZip;
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
                script.crossOrigin = 'anonymous';
                script.onload = () => resolve(window.JSZip);
                script.onerror = () => reject(new Error('JSZip 로드 실패'));
                document.head.appendChild(script);
            });
        },

        /**
         * 요소 생성 헬퍼 함수
         * @param {string} tag - HTML 태그 이름
         * @param {Object} attributes - 속성 객체
         * @param {string|HTMLElement|Array} children - 자식 요소(들)
         * @returns {HTMLElement} 생성된 요소
         */
        createElement: function(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);

            // 속성 설정
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.entries(value).forEach(([styleKey, styleValue]) => {
                        element.style[styleKey] = styleValue;
                    });
                } else if (key === 'className') {
                    element.className = value;
                } else if (key === 'dataset') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else if (key.startsWith('on') && typeof value === 'function') {
                    const eventType = key.substring(2).toLowerCase();
                    element.addEventListener(eventType, value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            // 자식 요소 추가
            if (children) {
                if (!Array.isArray(children)) {
                    children = [children];
                }

                children.forEach(child => {
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else if (child instanceof HTMLElement) {
                        element.appendChild(child);
                    }
                });
            }

            return element;
        }
    };

    // ======================== 3. 스토리지 관리 모듈 ========================
    const Storage = {
    /**
 * 설정값 가져오기
 * @param {string} key - 설정 키
 * @param {*} defaultValue - 기본값
 * @returns {*} 설정값
 */
get: function(key, defaultValue) {
    const value = localStorage.getItem(key);

    if (value === null) {
        return defaultValue;
    }

    try {
        // 불리언 문자열 처리
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // 숫자 문자열 처리
        if (!isNaN(value) && value.trim() !== '') {
            return Number(value); // 숫자 반환
        }

        // JSON 파싱 시도
        return JSON.parse(value);
    } catch (e) {
        console.error("JSON 파싱 오류:", e);
        // 일반 문자열이면 그대로 반환
        return value;
    }
},


        /**
         * 설정값 저장
         * @param {string} key - 설정 키
         * @param {*} value - 설정값
         */
        set: function(key, value) {
            if (typeof value === 'object') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, value);
            }
        },

        /**
         * 설정값 삭제
         * @param {string} key - 설정 키
         */
        remove: function(key) {
            localStorage.removeItem(key);
        },

        /**
         * 모든 설정값 백업
         * @returns {string} 백업 데이터 (JSON 문자열)
         */
        backupAll: function() {
            const backup = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // 스크립트 관련 설정만 백업 (필터링 가능)
                if (key === 'textExtraction' ||
                    key === 'tMainColor' ||
                    key === 'colorCode' ||
                    key === 'ns-icon-size' ||
                    key === 'ns-icon-url' ||
                    key === 'ns-italic' ||
                    key === 'ns-bold' ||
                    key === 'ns-highlight' ||
                    key === 'dplD' ||
                    key === 'dplApi' ||
                    key === 'cssStock' ||
                    key === 'tfStock' ||
                    key === 'tfStat' ||
                    key === 'selectedCssIndex' ||
                    key === 'tBallP' ||
                    key === 'remoteControl' ||
                    key.startsWith('gemini') ||
                    key.startsWith('image')) {
                    backup[key] = localStorage.getItem(key);
                }
            }
            return JSON.stringify(backup, null, 2);
        },

        /**
         * 백업 데이터 복원
         * @param {string} backupData - 백업 데이터 (JSON 문자열)
         * @returns {boolean} 성공 여부
         */
        restoreAll: function(backupData) {
            try {
                const backup = JSON.parse(backupData);
                Object.entries(backup).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                });
                return true;
            } catch (e) {
                console.error('백업 복원 실패:', e);
                return false;
            }
        }
    };

    // ======================== 4. UI 관리 모듈 ========================
    const UI = {
        // CSS 스타일 정의
        styles: `

:root {
    --main-color: ${Storage.get('tMainColor', CONFIG.defaultMainColor)};
    --highlight-color: ${Storage.get('colorCode', CONFIG.defaultHighlightColor)};
    --italic-active: normal;
    --bold-active: normal;
    --text-highlight-color: inherit;
    --remote-icon-url: none;
    --remote-button-size: ${Storage.get('remoteControl', CONFIG.remoteControl).buttonSize || CONFIG.remoteControl.buttonSize}px;
    --remote-button-gap: ${Storage.get('remoteControl', CONFIG.remoteControl).buttonGap || CONFIG.remoteControl.buttonGap}px;
}
:root {
    --highlight-color: 52, 152, 219; /* 하이라이트 색 */
}

.loading {
    animation: rotate-shadow 2s linear infinite;
}

@keyframes rotate-shadow {
    0% {
        box-shadow: 0 0 2px rgba(var(--highlight-color), 0.9); /* 기본 그림자 크기 */
    }
    50% {
        box-shadow: 0 0 10px rgba(var(--highlight-color), 0.9); /* 전체적으로 커지는 그림자 */
    }
    100% {
        box-shadow: 0 0 2px rgba(var(--highlight-color), 0.9); /* 원래 크기로 돌아감 */
    }
}

#remote-control {
    position: fixed;
    z-index: 11000;
    display: flex;
    flex-direction: ${Storage.get('remoteControl', CONFIG.remoteControl).orientation === 'horizontal' ? 'row' : 'column'};
    gap: var(--remote-button-gap);
    bottom: ${Storage.get('remoteControl', CONFIG.remoteControl).position?.bottom || CONFIG.remoteControl.position.bottom};
    right: ${Storage.get('remoteControl', CONFIG.remoteControl).position?.right || CONFIG.remoteControl.position.right};
}

.remote-button {
    width: var(--remote-button-size);
    height: var(--remote-button-size);
    border-radius: ${Storage.get('remoteControl', CONFIG.remoteControl).buttonShape === 'circle' ? '50%' : '4px'};
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--main-color);
    font-weight: bold;
    font-size: calc(var(--remote-button-size) * 0.4);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

#output-panel {
    display: none;
    flex-direction: column;
    position: fixed;
    z-index: 10000;
    width: 350px;
    max-width: 95%;
    background: var(--main-color);
    height: 100%;
    bottom: 0px;
    right: 0px;
    padding: 10px;
    transition: width 0.2s, height 0.2s;
    backdrop-filter: blur(30px);
}

#extracted-text {
    min-height: 85%;
    overflow: auto;
    padding: 10px;
    word-break: break-word;
}

#top-menu {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
}

.menu-button {
    padding: 5px 10px;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.menu-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

#settings-panel {
    display: none;
    flex-direction: cloumn;
    position: fixed;
    flex-direction: column;
    background-color: var(--main-color);
    padding: 20px;
    border-radius: 4px;
    z-index: 20000;
    width: 80%;
    max-width: 500px;
    min-height: 0px;
    height: 80vh;
    min-height:80vh;
    backdrop-filter: blur(30px);
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 10px;
}

.settings-tab {
    padding: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
}

.settings-tab.active {
    color: var(--highlight-color);
    font-weight: bold;
}

.settings-content {
flex-grow: 1;
    overflow: auto;
    min-height: 0;
}

.settings-section {
    display: none;
}

.settings-section.active {
    display: block;
}

.form-group {
    margin-bottom: 10px;
}

.form-label {
    display: block;
    margin-bottom: 5px;
}

.form-input {
    width: 100%;
    padding: 5px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.form-textarea {
    width: 100%;
    min-height: 100px;
    padding: 5px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    resize: vertical;
}

.form-select {
    width: 100%;
    padding: 5px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.form-checkbox {
    margin-right: 5px;
    width:15px;
    vertical-align: middle;
}

.form-button {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap; /* 텍스트 줄바꿈 방지 */
}

.form-button:hover {
    opacity: 0.9;
}

.close-button {
    position: absolute;   /* 패널 내에서 위치 고정 */
    top: 10px;            /* 상단에서 10px 떨어진 위치 */
    right: 10px;          /* 우측에서 10px 떨어진 위치 */
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 10;          /* 다른 내용들보다 위에 표시 */
}

#translation-input-container {
    width: 100%;
    margin-top: 10px;
}

#ko-en-input {
	margin-bottom: 10px;
    width: 100%;
    padding: 5px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

#image-panel {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--main-color);
    padding: 5px;
    border-radius: 4px;
    z-index: 20000;
    width: 90%;
    max-width: 1300px;
    max-height: 90vh;
    backdrop-filter: blur(30px);
}

.image-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.generated-image {
    max-width: 100%;
}

.image-controls {
    display: flex;
    gap: 10px;
}

.image-prompt {
    width: 80%;
    padding: 5px;
    margin: 10px 0;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.draggable-handle {
    cursor: move;
    flex-grow: 1;
    user-select: none;
}

/* 하이라이트 스타일 */
span.highlight-text {
    font-style: var(--italic-active) !important;
    font-weight: var(--bold-active) !important;
    color: var(--text-highlight-color) !important;
}

/* 기본 텍스트 스타일 */
.nm {
    margin: 0;
}

h1, h2, h3 {
    font-family: inherit;
}

/* CSS 프리셋 관련 스타일 */
.preset-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    margin-bottom: 5px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.1);
}

.preset-name {
    flex-grow: 1;
    margin-right: 10px;
}

.preset-controls {
    display: flex;
    gap: 5px;
}

/* 변환 규칙 관련 스타일 */
.transform-rule {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
}

.transform-input {
    flex-grow: 1;
    padding: 5px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}
`,

        // UI 요소 초기화
        init: function() {
            // 스타일 추가
            this.addStyles();

            // 리모컨 생성
            this.createRemoteControl();

            // 출력 패널 생성
            this.createOutputPanel();

            // 설정 패널 생성
            this.createSettingsPanel();

            // 이미지 패널 생성
            this.createImagePanel();

            // 키보드 단축키 설정
            this.setupKeyboardShortcuts();

            // 초기 UI 상태 설정
            this.updateTextStyle();
            this.toggleTranslationInput();
        },

        // 스타일 추가
        addStyles: function() {
            const styleElement = document.createElement('style');
            styleElement.textContent = this.styles;
            document.head.appendChild(styleElement);
        },

        // 리모컨 생성
        createRemoteControl: function() {
            const remoteControl = Utils.createElement('div', {
                id: 'remote-control'
            });

            // 번역 버튼
            const translateButton = Utils.createElement('div', {
                className: 'remote-button',
                id: 'translate-button',
                onclick: (e) => {
                    const clickedButton = e.currentTarget; // 클릭된 버튼은 'T' 버튼

                    // 1. 항상 번역 기능을 먼저 실행합니다. (로딩 애니메이션이 'T' 버튼에 적용됨)
                    Features.Translation.extractAndTranslate(clickedButton);

                    // 2. "번역 시 삽화 함께 생성" 옵션이 켜져 있는지 확인합니다.
                    const shouldGenerateImage = Storage.get('imageOnTranslate', false);
                    const isImageGenerationEnabled = Storage.get('imageGenerationEnabled', false);

                    // 3. 옵션이 켜져 있다면, 삽화 생성 기능도 호출합니다.
                    if (shouldGenerateImage && isImageGenerationEnabled) {
                        console.log("번역과 함께 삽화 생성을 시작합니다.");
                        // 이미지(I) 버튼을 찾아서 로딩 애니메이션을 적용하도록 전달합니다.
                        const imageButton = document.getElementById('image-button');
                        if (imageButton) {
                            Features.Image.generateImage(imageButton);
                        } else {
                            // imageButton이 없는 비상 상황을 대비해 null을 전달하여 오류를 방지합니다.
                            Features.Image.generateImage(null);
                        }
                    }
                }
            }, 'T');
            // 삽화 버튼
            const imageButton = Utils.createElement('div', {
                className: 'remote-button',
                id: 'image-button',
                style: {
                    display: Storage.get('imageGenerationEnabled', false) ? 'flex' : 'none'
                },
                onclick: (e) => {
    const clickedButton = e.currentTarget; // 클릭된 버튼 요소 캡처
                Features.Image.generateImage(clickedButton);
                }
            }, 'I');

            // 설정 버튼
            const settingsButton = Utils.createElement('div', {
                className: 'remote-button',
                id: 'settings-button',
                onclick: () => this.toggleSettingsPanel()
            }, '⚙');

            remoteControl.appendChild(translateButton);
            remoteControl.appendChild(imageButton);
            remoteControl.appendChild(settingsButton);

            document.body.appendChild(remoteControl);

            // 리모컨 드래그 기능 추가
            const savedPosition = Storage.get('remotePosition', null);
            const draggable = Utils.makeDraggable(remoteControl, null, (position) => {
                Storage.set('remotePosition', position);
            });

            if (savedPosition) {
                draggable.moveTo(savedPosition);
            }

        },


        // 출력 패널 생성
        createOutputPanel: function() {
            const outputPanel = Utils.createElement('div', {
                id: 'output-panel'
            });

            // 상단 메뉴
            const topMenu = Utils.createElement('div', {
                id: 'top-menu'
            });

            // 장문 버튼
            const longButton = Utils.createElement('button', {
                className: 'menu-button',
                id: 'long-button',
                onclick: (e) => {
    const clickedButton = e.currentTarget;
                Features.Translation.extractLongText(clickedButton);
                }
            }, '장문');

            // 복사 버튼
            const copyButton = Utils.createElement('button', {
                className: 'menu-button',
                id: 'copy-button',
                onclick: () => {
                    const text = Utils.stripHtml(document.getElementById('extracted-text').innerHTML);
                    Utils.copyToClipboard(text);
                }
            }, '복사');

            // 설정 버튼
            const settingsButton = Utils.createElement('button', {
                className: 'menu-button',
                id: 'panel-settings-button',
                onclick: () => this.toggleSettingsPanel()
            }, '설정');

            // 요약 버튼 (조건부 표시)
            const summaryButton = Utils.createElement('button', {
                className: 'menu-button',
                id: 'summary-button',
                style: {
                    display: Storage.get('geminiSummaryEnabled', false) ? 'block' : 'none'
                },
                onclick: (e) => {
    const clickedButton = e.currentTarget;
                Features.Summary.generateSummary(clickedButton);
                }
            }, '요약');

            topMenu.appendChild(longButton);
            topMenu.appendChild(copyButton);
            topMenu.appendChild(settingsButton);
            topMenu.appendChild(summaryButton);

            // 텍스트 출력 영역
            const extractedText = Utils.createElement('div', {
                id: 'extracted-text'
            });

            // 번역 입력 컨테이너
            const translationInputContainer = Utils.createElement('div', {
                id: 'translation-input-container',
                style: {
                    display: Storage.get('geminiInputEnabled', false) ? 'block' : 'none'
                }
            });

            // 번역 입력 필드
            const koEnInput = Utils.createElement('input', {
                id: 'ko-en-input',
                type: 'text',
                placeholder: '번역할 한국어를 입력하세요 (Enter로 번역)',
                onkeypress: async (e) => {
                    if (e.key === 'Enter') {
                        const text = e.target.value;
                        const translatedText = await Features.Translation.translateKoToEn(text);

                        const proseMirror = document.querySelector('.ProseMirror');
                        const lastParagraph = proseMirror.querySelector('p:last-child');

                        if (lastParagraph) {
                            const span = document.createElement('span');
                            span.className = 'userText';
                            span.textContent = translatedText;
                            lastParagraph.appendChild(span);
                        }

                        e.target.value = '';
                    }
                }
            });

            translationInputContainer.appendChild(koEnInput);

            outputPanel.appendChild(topMenu);
            outputPanel.appendChild(extractedText);
            outputPanel.appendChild(translationInputContainer);

            document.body.appendChild(outputPanel);

            // 출력 패널 클릭 이벤트 (닫기)
            extractedText.addEventListener('click', () => {
                this.toggleOutputPanel(false);
            });
        },

        // 설정 패널 생성
        createSettingsPanel: function() {
            const settingsPanel = Utils.createElement('div', {
                id: 'settings-panel'
            });

            // 헤더
            const header = Utils.createElement('div', {
                className: 'settings-header'
            });

            const title = Utils.createElement('h2', {}, '설정');

            const closeButton = Utils.createElement('button', {
                className: 'close-button',
                onclick: () => this.toggleSettingsPanel(false)
            }, '✕');

            header.appendChild(title);
            header.appendChild(closeButton);

            // 탭 메뉴
            const tabs = Utils.createElement('div', {
                className: 'settings-tabs'
            });

            // 탭 정의
            const tabsData = [
                { id: 'output', label: '출력' },
                { id: 'api', label: 'API' },
                { id: 'translation', label: '번역' },
                { id: 'extensions', label: '확장' },
                { id: 'summary', label: '요약', condition: () => Storage.get('geminiSummaryEnabled', false) },
                { id: 'image', label: '삽화', condition: () => Storage.get('imageGenerationEnabled', false) },
                { id: 'transform', label: '변환', condition: () => Storage.get('transformEnabled', false) },
                { id: 'css', label: 'CSS', condition: () => Storage.get('cssEnabled', false) },
                { id: 'remote', label: '리모컨' }
            ];

            // 탭 버튼 생성
            tabsData.forEach((tabData, index) => {
                // 조건부 표시 확인
                if (tabData.condition && !tabData.condition()) {
                    return;
                }

                const tab = Utils.createElement('button', {
                    className: `settings-tab ${index === 0 ? 'active' : ''}`,
                    dataset: { tab: tabData.id },
                    onclick: (e) => this.switchSettingsTab(e.target.dataset.tab)
                }, tabData.label);

                tabs.appendChild(tab);
            });

            // 설정 내용 영역
            const content = Utils.createElement('div', {
                className: 'settings-content'
            });

            // 출력 설정
            const outputSection = this.createOutputSettingsSection();
            outputSection.classList.add('active');

            // API 설정
            const apiSection = this.createApiSettingsSection();

            // 번역 설정
            const translationSection = this.createTranslationSettingsSection();

            // 확장 설정
            const extensionsSection = this.createExtensionsSettingsSection();

            // 요약 설정
            const summarySection = this.createSummarySettingsSection();

            // 삽화 설정
            const imageSection = this.createImageSettingsSection();

            // 변환 설정
            const transformSection = this.createTransformSettingsSection();

            // CSS 설정
            const cssSection = this.createCssSettingsSection();

            // 리모컨 설정
            const remoteSection = this.createRemoteSettingsSection();

            content.appendChild(outputSection);
            content.appendChild(apiSection);
            content.appendChild(translationSection);
            content.appendChild(extensionsSection);
            content.appendChild(summarySection);
            content.appendChild(imageSection);
            content.appendChild(transformSection);
            content.appendChild(cssSection);
            content.appendChild(remoteSection);

            settingsPanel.appendChild(header);
            settingsPanel.appendChild(tabs);
            settingsPanel.appendChild(content);

              
document.body.appendChild(settingsPanel); // 저장된 위치가 없으면 화면 중앙에 배치 const savedPosition = localStorage.getItem("settingsPanelPosition"); if (!savedPosition) { // 화면 중앙에 배치 const left = (window.innerWidth - settingsPanel.offsetWidth) / 2; const top = (window.innerHeight - settingsPanel.offsetHeight) / 2; settingsPanel.style.left = left + 'px'; settingsPanel.style.top = top + 'px'; }

// 설정 패널 드래그 기능 추가
if (settingsPanel) {
    const header = settingsPanel.querySelector('.settings-header') || settingsPanel.querySelector('.panel-header');
    Utils.makeDraggable(settingsPanel, header, null, "settingsPanelPosition");
}
},
// 출력 설정 섹션 생성
    createOutputSettingsSection: function() {
        const section = Utils.createElement('div', {
            className: 'settings-section',
            id: 'output-settings'
        });

        // 텍스트 추출 분량
        const extractionGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const extractionLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'text-extraction'
        }, '텍스트 추출분량:');

        const extractionInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'text-extraction',
            type: 'number',
            value: Storage.get('textExtraction', CONFIG.defaultTextExtraction),
            oninput: (e) => {
                Storage.set('textExtraction', e.target.value);
            }
        });

        extractionGroup.appendChild(extractionLabel);
        extractionGroup.appendChild(extractionInput);

        // 장문 추출 분량
        const longExtractionGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const longExtractionLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'long-extraction'
        }, '장문 추출분량:');

        const longExtractionInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'long-extraction',
            type: 'number',
            value: Storage.get('longExtraction', '1000000'),
            oninput: (e) => {
                Storage.set('longExtraction', e.target.value);
            }
        });

        longExtractionGroup.appendChild(longExtractionLabel);
        longExtractionGroup.appendChild(longExtractionInput);

        // 대사 강조 옵션
        const highlightGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const highlightLabel = Utils.createElement('label', {
            className: 'form-label'
        }, '대사강조:');

        // 이탤릭 체크박스
        const italicContainer = Utils.createElement('div', {
            style: { marginBottom: '5px' }
        });

        const italicCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'italic-checkbox',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('ns-italic', e.target.checked);
                this.updateTextStyle();
            }
        });
        italicCheckbox.checked = Storage.get('ns-italic', false);

        const italicLabel = Utils.createElement('label', {
            for: 'italic-checkbox'
        }, '이탤릭');

        italicContainer.appendChild(italicCheckbox);
        italicContainer.appendChild(italicLabel);

        // 볼드 체크박스
        const boldContainer = Utils.createElement('div', {
            style: { marginBottom: '5px' }
        });

        const boldCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'bold-checkbox',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('ns-bold', e.target.checked);
                this.updateTextStyle();
            }
        });
        boldCheckbox.checked = Storage.get('ns-bold', false);

        const boldLabel = Utils.createElement('label', {
            for: 'bold-checkbox'
        }, '볼드');

        boldContainer.appendChild(boldCheckbox);
        boldContainer.appendChild(boldLabel);

        // 하이라이트 체크박스
        const highlightContainer = Utils.createElement('div', {
            style: { marginBottom: '5px' }
        });

        const highlightCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'highlight-checkbox',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('ns-highlight', e.target.checked);
                this.updateTextStyle();
            }
        });
        highlightCheckbox.checked = Storage.get('ns-highlight', false);

        const highlightCheckboxLabel = Utils.createElement('label', {
            for: 'highlight-checkbox'
        }, '하이라이트');

        highlightContainer.appendChild(highlightCheckbox);
        highlightContainer.appendChild(highlightCheckboxLabel);

        highlightGroup.appendChild(highlightLabel);
        highlightGroup.appendChild(italicContainer);
        highlightGroup.appendChild(boldContainer);
        highlightGroup.appendChild(highlightContainer);

        // 하이라이트 색상
        const colorGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const colorLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'color-code'
        }, '하이라이트 색상:');

        const colorInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'color-code',
            type: 'text',
            value: Storage.get('colorCode', CONFIG.defaultHighlightColor),
            oninput: (e) => {
                Storage.set('colorCode', e.target.value);
                document.documentElement.style.setProperty('--highlight-color', e.target.value);
                this.updateTextStyle();
            }
        });

        const colorHelp = Utils.createElement('small', {}, '칼라코드는 #을 함께 입력');

        colorGroup.appendChild(colorLabel);
        colorGroup.appendChild(colorInput);
        colorGroup.appendChild(colorHelp);

        // 설정 백업/복원
        const backupGroup = Utils.createElement('div', {
            className: 'form-group',
            style: { marginTop: '20px' }
        });

        const backupLabel = Utils.createElement('label', {
            className: 'form-label'
        }, '설정 백업/복원:');

        const backupButtons = Utils.createElement('div', {
            style: { display: 'flex', gap: '10px' }
        });

        const backupButton = Utils.createElement('button', {
            className: 'form-button',
            onclick: () => {
                const backupData = Storage.backupAll();
                Utils.copyToClipboard(backupData);
                alert('설정이 클립보드에 복사되었습니다.');
            }
        }, '백업 복사');
const restoreButton = Utils.createElement('button', {
    className: 'form-button',
    onclick: () => {
        // 백업 데이터 입력을 위한 커스텀 팝업 생성
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.3);
                        z-index: 1000;">
                <h3>백업 데이터를 붙여넣으세요:</h3>
                <textarea id="backupInput" style="width: 300px; height: 150px;"></textarea>
                <br>
                <button id="restoreConfirm">복원</button>
                <button id="restoreCancel">취소</button>
            </div>
        `;

        document.body.appendChild(modal);

        // 이벤트 리스너 추가
        document.getElementById("restoreConfirm").addEventListener("click", () => {
            const backupData = document.getElementById("backupInput").value;
            if (backupData) {
                const success = Storage.restoreAll(backupData);
                if (success) {
                    alert('설정이 복원되었습니다. 페이지를 새로고침하세요.');
                    location.reload();
                } else {
                    alert('설정 복원에 실패했습니다. 백업 데이터를 확인하세요.');
                }
            }
            modal.remove();
        });

        document.getElementById("restoreCancel").addEventListener("click", () => {
            modal.remove();
        });
    }
}, '백업 복원');

        backupButtons.appendChild(backupButton);
        backupButtons.appendChild(restoreButton);

        backupGroup.appendChild(backupLabel);
        backupGroup.appendChild(backupButtons);

        section.appendChild(extractionGroup);
        section.appendChild(longExtractionGroup);
        section.appendChild(highlightGroup);
        section.appendChild(colorGroup);
        section.appendChild(backupGroup);

        return section;
    },

    // API 설정 섹션 생성
    createApiSettingsSection: function() {
        const section = Utils.createElement('div', {
            className: 'settings-section',
            id: 'api-settings'
        });

        // Gemini API 설정
        const geminiGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const geminiTitle = Utils.createElement('h3', {}, 'Gemini API');

        const geminiApiLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-api'
        }, 'API Key:');

        const geminiApiInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'gemini-api',
            type: 'text',
            value: Storage.get('geminiApi', ''),
            oninput: (e) => {
                Storage.set('geminiApi', e.target.value);
            }
        });

        const geminiApiStatus = Utils.createElement('span', {
            id: 'gemini-api-status',
            style: {
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'gray',
                marginLeft: '5px'
            }
        });

        geminiGroup.appendChild(geminiTitle);
        geminiGroup.appendChild(geminiApiLabel);
        geminiGroup.appendChild(geminiApiInput);
        geminiGroup.appendChild(geminiApiStatus);

        // DeepL API 설정
        const deeplGroup = Utils.createElement('div', {
            className: 'form-group',
            style: { marginTop: '20px' }
        });

        const deeplTitle = Utils.createElement('h3', {}, 'DeepL API');

        const deeplApiLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'deepl-api'
        }, 'API Key:');

        const deeplApiInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'deepl-api',
            type: 'text',
            value: Storage.get('dplApi', ''),
            oninput: (e) => {
                Storage.set('dplApi', e.target.value);
            }
        });

        const deeplApiStatus = Utils.createElement('span', {
            id: 'deepl-api-status',
            style: {
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'gray',
                marginLeft: '5px'
            }
        });

        deeplGroup.appendChild(deeplTitle);
        deeplGroup.appendChild(deeplApiLabel);
        deeplGroup.appendChild(deeplApiInput);
        deeplGroup.appendChild(deeplApiStatus);

        // NovelAI API 설정
        const novelaiGroup = Utils.createElement('div', {
            className: 'form-group',
            style: { marginTop: '20px' }
        });

        const novelaiTitle = Utils.createElement('h3', {}, 'NovelAI API');

        const novelaiApiLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'novelai-api'
        }, 'API Key:');

        const novelaiApiInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'novelai-api',
            type: 'text',
            value: Storage.get('novelaiApiKey', ''),
            oninput: (e) => {
                Storage.set('novelaiApiKey', e.target.value);
                Features.Image.checkApiStatus(e.target.value);
            }
        });

        const novelaiApiStatus = Utils.createElement('span', {
            id: 'novelai-api-status',
            style: {
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'gray',
                marginLeft: '5px'
            }
        });

        novelaiGroup.appendChild(novelaiTitle);
        novelaiGroup.appendChild(novelaiApiLabel);
        novelaiGroup.appendChild(novelaiApiInput);
        novelaiGroup.appendChild(novelaiApiStatus);

        section.appendChild(geminiGroup);
        section.appendChild(deeplGroup);
        section.appendChild(novelaiGroup);

        // API 상태 확인
        setTimeout(() => {
            Features.Image.checkApiStatus(Storage.get('novelaiApiKey', ''));
        }, 1000);

        return section;
    },

    // 번역 설정 섹션 생성
    createTranslationSettingsSection: function() {
        const section = Utils.createElement('div', {
            className: 'settings-section',
            id: 'translation-settings'
        });

        // 번역 엔진 선택
        const engineGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const engineLabel = Utils.createElement('label', {
            className: 'form-label'
        }, '기본 번역 엔진:');

        // Gemini 라디오 버튼
        const geminiContainer = Utils.createElement('div', {
            style: { marginBottom: '5px' }
        });

        const geminiRadio = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'gemini-radio',
            type: 'radio',
            name: 'translation-engine',
            onchange: (e) => {
                if (e.target.checked) {
                    Storage.set('geminiDefault', true);
                    Storage.set('dplD', false);
                    document.getElementById('deepl-radio').checked = false;
                    document.getElementById('none-radio').checked = false;
                }
            }
        });
        geminiRadio.checked = Storage.get('geminiDefault', false);

        const geminiRadioLabel = Utils.createElement('label', {
            for: 'gemini-radio'
        }, 'Gemini');

        geminiContainer.appendChild(geminiRadio);
        geminiContainer.appendChild(geminiRadioLabel);

        // DeepL 라디오 버튼
        const deeplContainer = Utils.createElement('div', {
            style: { marginBottom: '5px' }
        });

        const deeplRadio = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'deepl-radio',
            type: 'radio',
            name: 'translation-engine',
            onchange: (e) => {
                if (e.target.checked) {
                    Storage.set('dplD', true);
                    Storage.set('geminiDefault', false);
                    document.getElementById('gemini-radio').checked = false;
                    document.getElementById('none-radio').checked = false;
                }
            }
        });
        deeplRadio.checked = Storage.get('dplD', false);

        const deeplRadioLabel = Utils.createElement('label', {
            for: 'deepl-radio'
        }, 'DeepL');

        deeplContainer.appendChild(deeplRadio);
        deeplContainer.appendChild(deeplRadioLabel);

        // 번역 안함 라디오 버튼
        const noneContainer = Utils.createElement('div', {
            style: { marginBottom: '5px' }
        });

        const noneRadio = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'none-radio',
            type: 'radio',
            name: 'translation-engine',
            onchange: (e) => {
                if (e.target.checked) {
                    Storage.set('geminiDefault', false);
                    Storage.set('dplD', false);
                    document.getElementById('gemini-radio').checked = false;
                    document.getElementById('deepl-radio').checked = false;
                }
            }
        });
        noneRadio.checked = !Storage.get('geminiDefault', false) && !Storage.get('dplD', false);

        const noneRadioLabel = Utils.createElement('label', {
            for: 'none-radio'
        }, '번역 안함');

        noneContainer.appendChild(noneRadio);
        noneContainer.appendChild(noneRadioLabel);

        engineGroup.appendChild(engineLabel);
        engineGroup.appendChild(geminiContainer);
        engineGroup.appendChild(deeplContainer);
        engineGroup.appendChild(noneContainer);

        // Gemini 모델 선택
        const modelGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const modelLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-model'
        }, 'Gemini 모델:');

        const modelSelect = Utils.createElement('select', {
            className: 'form-select',
            id: 'gemini-model',
            onchange: (e) => {
                Storage.set('geminiModel', e.target.value);
            }
        });

        const modelOptions = [
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash',
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.5-pro-preview-06-05'
        ];

        const selectedModel = Storage.get('geminiModel', CONFIG.defaultGeminiModel);

        modelOptions.forEach(option => {
            const optionElement = Utils.createElement('option', {
                value: option,
                selected: option === selectedModel
            }, option);

            modelSelect.appendChild(optionElement);
        });
        modelSelect.value = selectedModel;

        modelGroup.appendChild(modelLabel);
        modelGroup.appendChild(modelSelect);

        // 영한 번역 프롬프트
        const promptGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const promptLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-prompt'
        }, '영한 번역 프롬프트:');

        const promptTextarea = Utils.createElement('textarea', {
            className: 'form-textarea',
            id: 'gemini-prompt',
            oninput: (e) => {
                Storage.set('geminiPrompt', e.target.value);
            }
        }, Storage.get('geminiPrompt', CONFIG.defaultGeminiPrompt));

        promptGroup.appendChild(promptLabel);
        promptGroup.appendChild(promptTextarea);

        // 한영 번역 프롬프트
        const koEnPromptGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const koEnPromptLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-ko-en-prompt'
        }, '한영 번역 프롬프트:');

        const koEnPromptTextarea = Utils.createElement('textarea', {
            className: 'form-textarea',
            id: 'gemini-ko-en-prompt',
            oninput: (e) => {
                Storage.set('geminiKoEnPrompt', e.target.value);
            }
        }, Storage.get('geminiKoEnPrompt', CONFIG.defaultGeminiKoEnPrompt));

        koEnPromptGroup.appendChild(koEnPromptLabel);
        koEnPromptGroup.appendChild(koEnPromptTextarea);

        // Gemini 파라미터 설정
        const paramsGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const paramsTitle = Utils.createElement('h3', {}, 'Gemini 파라미터 설정');

        // Temperature
        const tempContainer = Utils.createElement('div', {
            style: { marginBottom: '10px' }
        });

        const tempLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-temperature'
        }, '온도:');

        const tempInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'gemini-temperature',
            type: 'number',
            min: '0',
            max: '1',
            step: '0.1',
            value: Storage.get('geminiTemperature', '0.6'),
            oninput: (e) => {
                Storage.set('geminiTemperature', e.target.value);
            }
        });

        tempContainer.appendChild(tempLabel);
        tempContainer.appendChild(tempInput);

        // Top K
        const topKContainer = Utils.createElement('div', {
            style: { marginBottom: '10px' }
        });

        const topKLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-top-k'
        }, 'Top K:');

        const topKInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'gemini-top-k',
            type: 'number',
            min: '0',
            value: Storage.get('geminiTopK', '10'),
            oninput: (e) => {
                Storage.set('geminiTopK', e.target.value);
            }
        });

        topKContainer.appendChild(topKLabel);
        topKContainer.appendChild(topKInput);

        // Top P
        const topPContainer = Utils.createElement('div', {
            style: { marginBottom: '10px' }
        });

        const topPLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'gemini-top-p'
        }, 'Top P:');

        const topPInput = Utils.createElement('input', {
            className: 'form-input',
            id: 'gemini-top-p',
            type: 'number',
            min: '0',
            max: '1',
            step: '0.01',
            value: Storage.get('geminiTopP', '0.99'),
            oninput: (e) => {
                Storage.set('geminiTopP', e.target.value);
            }
        });

        paramsGroup.appendChild(paramsTitle);
        paramsGroup.appendChild(tempContainer);
        paramsGroup.appendChild(topKContainer);
        paramsGroup.appendChild(topPContainer);

        section.appendChild(engineGroup);
        section.appendChild(modelGroup);
        section.appendChild(promptGroup);
        section.appendChild(koEnPromptGroup);
        section.appendChild(paramsGroup);

        return section;
    },

    // 확장 설정 섹션 생성
    createExtensionsSettingsSection: function() {
        const section = Utils.createElement('div', {
            className: 'settings-section',
            id: 'extensions-settings'
        });

        const title = Utils.createElement('h3', {}, '확장 기능 활성화');

        // 한영 입력창
        const koEnInputGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const koEnInputCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'ko-en-input-enabled',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('geminiInputEnabled', e.target.checked);
                this.toggleTranslationInput();
            }
        });
        koEnInputCheckbox.checked = Storage.get('geminiInputEnabled', false);

        const koEnInputLabel = Utils.createElement('label', {
            for: 'ko-en-input-enabled'
        }, '한영 입력창');

        koEnInputGroup.appendChild(koEnInputCheckbox);
        koEnInputGroup.appendChild(koEnInputLabel);


            // 요약 기능
            const summaryGroup = Utils.createElement('div', {
                className: 'form-group'
            });

        const summaryCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'summary-enabled',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('geminiSummaryEnabled', e.target.checked);
                this.updateExtensionVisibility();
            }
        });
        summaryCheckbox.checked = Storage.get('geminiSummaryEnabled', false);
            const summaryLabel = Utils.createElement('label', {
                for: 'summary-enabled'
            }, '요약 기능');

            summaryGroup.appendChild(summaryCheckbox);
            summaryGroup.appendChild(summaryLabel);

        // CSS 프리셋
        const cssGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const cssCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'css-enabled',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('cssEnabled', e.target.checked);
                this.updateExtensionVisibility();
            }
        });
        cssCheckbox.checked = Storage.get('cssEnabled', false);

        const cssLabel = Utils.createElement('label', {
            for: 'css-enabled'
        }, 'CSS 프리셋');

        cssGroup.appendChild(cssCheckbox);
        cssGroup.appendChild(cssLabel);

        // 삽화 생성
        const imageGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const imageCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'image-enabled',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('imageGenerationEnabled', e.target.checked);
                this.updateExtensionVisibility();

                // 삽화 버튼 표시/숨김
                const imageButton = document.getElementById('image-button');
                if (imageButton) {
                    imageButton.style.display = e.target.checked ? 'flex' : 'none';
                }
            }
        });
        imageCheckbox.checked = Storage.get('imageGenerationEnabled', false);

        const imageLabel = Utils.createElement('label', {
            for: 'image-enabled'
        }, '삽화 생성');

        imageGroup.appendChild(imageCheckbox);
        imageGroup.appendChild(imageLabel);

        // 변환 기능
        const transformGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const transformCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'transform-enabled',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('transformEnabled', e.target.checked);
                this.updateExtensionVisibility();
            }
        });
        transformCheckbox.checked = Storage.get('transformEnabled', false);

        const transformLabel = Utils.createElement('label', {
            for: 'transform-enabled'
        }, '변환 기능');

        transformGroup.appendChild(transformCheckbox);
        transformGroup.appendChild(transformLabel);

        section.appendChild(title);
        section.appendChild(koEnInputGroup);
        section.appendChild(summaryGroup);
        section.appendChild(cssGroup);
        section.appendChild(imageGroup);
        section.appendChild(transformGroup);

        return section;
    },

    // 요약 설정 섹션 생성
    createSummarySettingsSection: function() {
        const section = Utils.createElement('div', {
            className: 'settings-section',
            id: 'summary-settings'
        });

        const title = Utils.createElement('h3', {}, '요약 설정');

        // 요약 프롬프트
        const promptGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const promptLabel = Utils.createElement('label', {
            className: 'form-label',
            for: 'summary-prompt'
        }, '요약 프롬프트:');

        const promptTextarea = Utils.createElement('textarea', {
            className: 'form-textarea',
            id: 'summary-prompt',
            oninput: (e) => {
                Storage.set('geminiSummaryPrompt', e.target.value);
            }
        }, Storage.get('geminiSummaryPrompt', CONFIG.defaultGeminiSummaryPrompt));

        promptGroup.appendChild(promptLabel);
        promptGroup.appendChild(promptTextarea);

        section.appendChild(title);
        section.appendChild(promptGroup);

        return section;
    },
// 이미지 설정 섹션 수정
createImageSettingsSection: function() {
    const section = Utils.createElement('div', {
        className: 'settings-section',
        id: 'image-settings'
    });

    const title = Utils.createElement('h3', {}, 'Image Generation Settings');

    // NEW: 번역 시 삽화 동시 생성 체크박스 추가
    const simultaneousGenerationGroup = Utils.createElement('div', { className: 'form-group' });
    const simultaneousGenerationCheckbox = Utils.createElement('input', {
        className: 'form-checkbox',
        id: 'image-on-translate-checkbox',
        type: 'checkbox',
        onchange: (e) => Storage.set('imageOnTranslate', e.target.checked)
    });
    simultaneousGenerationCheckbox.checked = Storage.get('imageOnTranslate', false); // 저장된 값 불러오기
    const simultaneousGenerationLabel = Utils.createElement('label', { for: 'image-on-translate-checkbox' }, '번역 시 삽화 함께 생성하기');

    simultaneousGenerationGroup.appendChild(simultaneousGenerationCheckbox);
    simultaneousGenerationGroup.appendChild(simultaneousGenerationLabel);
    // 삽화 프롬프트 생성용 프롬프트
    const promptGroup = Utils.createElement('div', { className: 'form-group' });
    const promptLabel = Utils.createElement('label', { className: 'form-label', for: 'image-prompt' }, 'Image Prompt (Gemini):');
    const promptTextarea = Utils.createElement('textarea', {
        className: 'form-textarea',
        id: 'image-prompt',
        oninput: (e) => Storage.set('imagePrompt', e.target.value)
    }, Storage.get('imagePrompt', CONFIG.defaultImagePrompt));
    promptGroup.appendChild(promptLabel);
    promptGroup.appendChild(promptTextarea);

    // 메인 프롬프트 (Positive)
    const mainPromptGroup = Utils.createElement('div', { className: 'form-group' });
    const mainPromptLabel = Utils.createElement('label', { className: 'form-label', for: 'main-prompt' }, 'Main Prompt (Positive):');
    const mainPromptTextarea = Utils.createElement('textarea', {
        className: 'form-textarea', id: 'main-prompt',
        oninput: (e) => Storage.set('mainPrompt', e.target.value)
    }, Storage.get('mainPrompt', CONFIG.defaultMainPrompt));
    mainPromptGroup.appendChild(mainPromptLabel);
    mainPromptGroup.appendChild(mainPromptTextarea);

    // UC 프롬프트 (Negative)
    const ucPromptGroup = Utils.createElement('div', { className: 'form-group' });
    const ucPromptLabel = Utils.createElement('label', { className: 'form-label', for: 'uc-prompt' }, 'UC Prompt (Negative):');
    const ucPromptTextarea = Utils.createElement('textarea', {
        className: 'form-textarea', id: 'uc-prompt',
        oninput: (e) => Storage.set('ucPrompt', e.target.value)
    }, Storage.get('ucPrompt', CONFIG.defaultUcPrompt));
    ucPromptGroup.appendChild(ucPromptLabel);
    ucPromptGroup.appendChild(ucPromptTextarea);

    // 모델 선택
    const modelGroup = Utils.createElement('div', { className: 'form-group' });
    const modelLabel = Utils.createElement('label', { className: 'form-label', for: 'image-model' }, 'Model:');
    const modelSelect = Utils.createElement('select', {
        className: 'form-select', id: 'image-model',
        onchange: (e) => Storage.set('imageModel', e.target.value)
    });
    const modelOptions = [
        { value: 'nai-diffusion-4-5-full', text: 'NAI Diffusion Anime V4.5 (Full)'},
        { value: 'nai-diffusion-4-5-curated', text: 'NAI Diffusion Anime V4.5 (Curated)'},
        { value: 'nai-diffusion-4-full', text: 'NAI Diffusion Anime V4 (Full)'},
        { value: 'nai-diffusion-4-curated-preview', text: 'NAI Diffusion Anime V4 (Curated)'},
        { value: 'nai-diffusion-3', text: 'NAI Diffusion Anime V3'},
        { value: 'nai-diffusion-2', text: 'NAI Diffusion Anime V2'},
        { value: 'nai-diffusion-furry-3', text: 'NAI Diffusion Furry V3'}
    ];
    const selectedModel = Storage.get('imageModel', CONFIG.imageGeneration.model);
    modelOptions.forEach(option => {
        const optionElement = Utils.createElement('option', { value: option.value, selected: option.value === selectedModel }, option.text);
        modelSelect.appendChild(optionElement);
    });
    modelSelect.value = selectedModel;
    modelGroup.appendChild(modelLabel);
    modelGroup.appendChild(modelSelect);

    // 삽화 사이즈
    const sizeGroup = Utils.createElement('div', { className: 'form-group' });
    const sizeLabel = Utils.createElement('label', { className: 'form-label', for: 'image-size' }, 'Image Size:');
    const sizeSelect = Utils.createElement('select', {
        className: 'form-select', id: 'image-size',
        onchange: (e) => Storage.set('imageSize', e.target.value)
    });
    const sizeOptions = [
        { value: 'Portrait', label: 'Portrait (832x1216)' },
        { value: 'Landscape', label: 'Landscape (1216x832)' },
        { value: 'Square', label: 'Square (1024x1024)' }
    ];
    const selectedSize = Storage.get('imageSize', 'Portrait');
    sizeOptions.forEach(option => {
        const optionElement = Utils.createElement('option', { value: option.value, selected: option.value === selectedSize }, option.label);
        sizeSelect.appendChild(optionElement);
    });
    sizeSelect.value = selectedSize;
    sizeGroup.appendChild(sizeLabel);
    sizeGroup.appendChild(sizeSelect);

    // 샘플러
    const samplerGroup = Utils.createElement('div', { className: 'form-group' });
    const samplerLabel = Utils.createElement('label', { className: 'form-label', for: 'image-sampler' }, 'Sampler:');
    const samplerSelect = Utils.createElement('select', {
        className: 'form-select', id: 'image-sampler',
        onchange: (e) => Storage.set('imageSampler', e.target.value)
    });
    const samplerOptions = [ 'k_euler_ancestral', 'k_euler', 'k_dpmpp_2m', 'k_dpmpp_sde', 'k_dpmpp_2s_ancestral', 'k_dpm_fast', 'ddim' ];
    const selectedSampler = Storage.get('imageSampler', CONFIG.imageGeneration.sampler);
    samplerOptions.forEach(option => {
        const optionElement = Utils.createElement('option', { value: option, selected: option === selectedSampler }, option);
        samplerSelect.appendChild(optionElement);
    });
    samplerSelect.value = selectedSampler;
    samplerGroup.appendChild(samplerLabel);
    samplerGroup.appendChild(samplerSelect);

    // 스케줄러 (추가됨)
    const schedulerGroup = Utils.createElement('div', { className: 'form-group' });
    const schedulerLabel = Utils.createElement('label', { className: 'form-label', for: 'image-scheduler' }, 'Scheduler:');
    const schedulerSelect = Utils.createElement('select', {
        className: 'form-select', id: 'image-scheduler',
        onchange: (e) => Storage.set('imageScheduler', e.target.value)
    });
    const schedulerOptions = [ 'karras', 'native', 'exponential', 'polyexponential' ];
    const selectedScheduler = Storage.get('imageScheduler', CONFIG.imageGeneration.scheduler);
    schedulerOptions.forEach(option => {
        const optionElement = Utils.createElement('option', { value: option, selected: option === selectedScheduler }, option);
        schedulerSelect.appendChild(optionElement);
    });
    schedulerSelect.value = selectedScheduler;
    schedulerGroup.appendChild(schedulerLabel);
    schedulerGroup.appendChild(schedulerSelect);

    // 스텝
    const stepsGroup = Utils.createElement('div', { className: 'form-group' });
    const stepsLabel = Utils.createElement('label', { className: 'form-label', for: 'image-steps' }, 'Steps:');
    const stepsInput = Utils.createElement('input', {
        className: 'form-input', id: 'image-steps', type: 'number', min: '1', max: '50',
        value: Storage.get('imageSteps', CONFIG.imageGeneration.steps),
        oninput: (e) => Storage.set('imageSteps', e.target.value)
    });
    stepsGroup.appendChild(stepsLabel);
    stepsGroup.appendChild(stepsInput);

    // 가이던스 스케일
    const scaleGroup = Utils.createElement('div', { className: 'form-group' });
    const scaleLabel = Utils.createElement('label', { className: 'form-label', for: 'image-scale' }, 'Guidance Scale:');
    const scaleInput = Utils.createElement('input', {
        className: 'form-input', id: 'image-scale', type: 'number', min: '1', max: '20', step: '0.1',
        value: Storage.get('imageScale', CONFIG.imageGeneration.scale),
        oninput: (e) => Storage.set('imageScale', e.target.value)
    });
    scaleGroup.appendChild(scaleLabel);
    scaleGroup.appendChild(scaleInput);

    // Smea/Smea DYN/Decrisper (추가됨)
    const extraOptionsGroup = Utils.createElement('div', { className: 'form-group' });

    const smCheckbox = Utils.createElement('input', { className: 'form-checkbox', id: 'image-sm', type: 'checkbox', onchange: (e) => Storage.set('imageSm', e.target.checked) });
    smCheckbox.checked = Storage.get('imageSm', CONFIG.imageGeneration.sm);
    const smLabel = Utils.createElement('label', { for: 'image-sm' }, 'Smea');

    const smDynCheckbox = Utils.createElement('input', { className: 'form-checkbox', id: 'image-sm-dyn', type: 'checkbox', onchange: (e) => Storage.set('imageSmDyn', e.target.checked) });
    smDynCheckbox.checked = Storage.get('imageSmDyn', CONFIG.imageGeneration.sm_dyn);
    const smDynLabel = Utils.createElement('label', { for: 'image-sm-dyn' }, 'Smea DYN');

    const decrisperCheckbox = Utils.createElement('input', { className: 'form-checkbox', id: 'image-decrisper', type: 'checkbox', onchange: (e) => Storage.set('imageDecrisper', e.target.checked) });
    decrisperCheckbox.checked = Storage.get('imageDecrisper', CONFIG.imageGeneration.decrisper);
    const decrisperLabel = Utils.createElement('label', { for: 'image-decrisper' }, 'Decrisper');

    extraOptionsGroup.appendChild(smCheckbox);
    extraOptionsGroup.appendChild(smLabel);
    extraOptionsGroup.appendChild(smDynCheckbox);
    extraOptionsGroup.appendChild(smDynLabel);
    extraOptionsGroup.appendChild(decrisperCheckbox);
    extraOptionsGroup.appendChild(decrisperLabel);

    section.appendChild(title);
	section.appendChild(simultaneousGenerationGroup);
    section.appendChild(promptGroup);
    section.appendChild(mainPromptGroup);
    section.appendChild(ucPromptGroup);
    section.appendChild(modelGroup);
    section.appendChild(sizeGroup);
    section.appendChild(samplerGroup);
    section.appendChild(schedulerGroup);
    section.appendChild(stepsGroup);
    section.appendChild(scaleGroup);
    section.appendChild(extraOptionsGroup);

    return section;
},

        // 변환 설정 섹션 생성
        createTransformSettingsSection: function() {
            const section = Utils.createElement('div', {
                className: 'settings-section',
                id: 'transform-settings'
            });

            const title = Utils.createElement('h3', {}, '변환 설정');

        // 변환 활성화
        const enableGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const enableCheckbox = Utils.createElement('input', {
            className: 'form-checkbox',
            id: 'transform-active',
            type: 'checkbox',
            onchange: (e) => {
                Storage.set('tfStat', e.target.checked);
            }
        });
        enableCheckbox.checked = Storage.get('tfStat', false);

        const enableLabel = Utils.createElement('label', {
            for: 'transform-active'
        }, '변환 활성화');

        enableGroup.appendChild(enableCheckbox);
        enableGroup.appendChild(enableLabel);

        // 변환 규칙 추가
        const addGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const addLabel = Utils.createElement('label', {
            className: 'form-label'
        }, '변환 규칙 추가:');

        const addContainer = Utils.createElement('div', {
            className: 'transform-rule'
        });

        const beforeInput = Utils.createElement('input', {
            className: 'transform-input',
            id: 'transform-before',
            type: 'text',
            placeholder: '원본'
        });

        const afterInput = Utils.createElement('input', {
            className: 'transform-input',
            id: 'transform-after',
            type: 'text',
            placeholder: '수정 후'
        });

        const addButton = Utils.createElement('button', {
            className: 'form-button',
            onclick: () => {
                const before = beforeInput.value.trim();
                const after = afterInput.value.trim();

                if (before && after) {
                    Features.Transform.addRule(before, after);
                    beforeInput.value = '';
                    afterInput.value = '';
                    this.updateTransformRules();
                }
            }
        }, '추가');

        addContainer.appendChild(beforeInput);
        addContainer.appendChild(afterInput);
        addContainer.appendChild(addButton);

        addGroup.appendChild(addLabel);
        addGroup.appendChild(addContainer);

        // 변환 규칙 목록
        const rulesGroup = Utils.createElement('div', {
            className: 'form-group'
        });

        const rulesLabel = Utils.createElement('label', {
            className: 'form-label'
        }, '변환 규칙 목록:');

        const rulesList = Utils.createElement('div', {
            id: 'transform-rules-list',
            style: {
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '5px',
                marginTop: '5px'
            }
        });

        rulesGroup.appendChild(rulesLabel);
        rulesGroup.appendChild(rulesList);

        section.appendChild(title);
        section.appendChild(enableGroup);
        section.appendChild(addGroup);
        section.appendChild(rulesGroup);

        return section;
    },


        // CSS 설정 섹션 생성
        createCssSettingsSection: function() {
            const section = Utils.createElement('div', {
                className: 'settings-section',
                id: 'css-settings'
            });

            const title = Utils.createElement('h3', {}, 'CSS 프리셋');

            // 프리셋 추가
            const addGroup = Utils.createElement('div', {
                className: 'form-group'
            });

            const addButton = Utils.createElement('button', {
                className: 'form-button',
                onclick: () => Features.CssPreset.addPreset()
            }, '+ 프리셋 추가');

            addGroup.appendChild(addButton);

            // 프리셋 목록
            const presetsGroup = Utils.createElement('div', {
                className: 'form-group'
            });

            const presetsList = Utils.createElement('div', {
                id: 'css-presets-list',
                style: {
                    maxHeight: '200px',
                    overflow: 'auto',
                    marginTop: '10px'
                }
            });

            presetsGroup.appendChild(presetsList);

            // 백업 버튼
            const backupGroup = Utils.createElement('div', {
                className: 'form-group',
                style: { marginTop: '20px' }
            });

            const backupButtons = Utils.createElement('div', {
                style: { display: 'flex', gap: '10px' }
            });

            const backupButton = Utils.createElement('button', {
                className: 'form-button',
                onclick: () => Features.CssPreset.backupPresets()
            }, '백업 복사');

            const restoreButton = Utils.createElement('button', {
                className: 'form-button',
                onclick: () => Features.CssPreset.importPresets()
            }, '백업 등록');

            backupButtons.appendChild(backupButton);
            backupButtons.appendChild(restoreButton);

            backupGroup.appendChild(backupButtons);

            section.appendChild(title);
            section.appendChild(addGroup);
            section.appendChild(presetsGroup);
            section.appendChild(backupGroup);

            return section;
        },

        // 리모컨 설정 섹션 생성
        createRemoteSettingsSection: function() {
            const section = Utils.createElement('div', {
                className: 'settings-section',
                id: 'remote-settings'
            });

            const title = Utils.createElement('h3', {}, '리모컨 설정');

            // 버튼 크기
            const sizeGroup = Utils.createElement('div', {
                className: 'form-group'
            });

            const sizeLabel = Utils.createElement('label', {
                className: 'form-label',
                for: 'remote-button-size'
            }, '버튼 크기:');

            const sizeInput = Utils.createElement('input', {
                className: 'form-input',
                id: 'remote-button-size',
                type: 'number',
                min: '20',
                max: '500',
                value: Storage.get('remoteControl', CONFIG.remoteControl).buttonSize || CONFIG.remoteControl.buttonSize,
                oninput: (e) => {
                    const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                    remoteConfig.buttonSize = parseInt(e.target.value);
                    Storage.set('remoteControl', remoteConfig);
                    document.documentElement.style.setProperty('--remote-button-size', e.target.value + 'px');
                }
            });

            sizeGroup.appendChild(sizeLabel);
            sizeGroup.appendChild(sizeInput);

            // 버튼 간격
            const gapGroup = Utils.createElement('div', {
                className: 'form-group'
            });

            const gapLabel = Utils.createElement('label', {
                className: 'form-label',
                for: 'remote-button-gap'
            }, '버튼 간격:');

            const gapInput = Utils.createElement('input', {
                className: 'form-input',
                id: 'remote-button-gap',
                type: 'number',
                min: '0',
                max: '50',
                value: Storage.get('remoteControl', CONFIG.remoteControl).buttonGap || CONFIG.remoteControl.buttonGap,
                oninput: (e) => {
                    const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                    remoteConfig.buttonGap = parseInt(e.target.value);
                    Storage.set('remoteControl', remoteConfig);
                    document.documentElement.style.setProperty('--remote-button-gap', e.target.value + 'px');
                }
            });

            gapGroup.appendChild(gapLabel);
            gapGroup.appendChild(gapInput);

            // 버튼 모양
            const shapeGroup = Utils.createElement('div', {
                className: 'form-group'
            });

            const shapeLabel = Utils.createElement('label', {
                className: 'form-label'
            }, '버튼 모양:');

            // 동그라미 라디오 버튼
            const circleContainer = Utils.createElement('div', {
                style: { marginBottom: '5px' }
            });

            const circleRadio = Utils.createElement('input', {
                className: 'form-checkbox',
                id: 'circle-radio',
                type: 'radio',
                name: 'button-shape',
                onchange: (e) => {
                    if (e.target.checked) {
                        const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                        remoteConfig.buttonShape = 'circle';
                        Storage.set('remoteControl', remoteConfig);

                        const buttons = document.querySelectorAll('.remote-button');
                        buttons.forEach(button => {
                            button.style.borderRadius = '50%';
                        });
                    }
                }
            });
            circleRadio.checked = Storage.get('remoteControl', CONFIG.remoteControl).buttonShape === 'circle';

            const circleLabel = Utils.createElement('label', {
                for: 'circle-radio'
            }, '동그라미');

            circleContainer.appendChild(circleRadio);
            circleContainer.appendChild(circleLabel);

            // 네모 라디오 버튼
            const squareContainer = Utils.createElement('div', {
                style: { marginBottom: '5px' }
            });

            const squareRadio = Utils.createElement('input', {
                className: 'form-checkbox',
                id: 'square-radio',
                type: 'radio',
                name: 'button-shape',
                onchange: (e) => {
                    if (e.target.checked) {
                        const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                        remoteConfig.buttonShape = 'square';
                        Storage.set('remoteControl', remoteConfig);

                        const buttons = document.querySelectorAll('.remote-button');
                        buttons.forEach(button => {
                            button.style.borderRadius = '4px';
                        });
                    }
                }
            });
            squareRadio.checked = Storage.get('remoteControl', CONFIG.remoteControl).buttonShape === 'square';

            const squareLabel = Utils.createElement('label', {
                for: 'square-radio'
            }, '네모');

            squareContainer.appendChild(squareRadio);
            squareContainer.appendChild(squareLabel);

            shapeGroup.appendChild(shapeLabel);
            shapeGroup.appendChild(circleContainer);
            shapeGroup.appendChild(squareContainer);

            // 버튼 배열
            const orientationGroup = Utils.createElement('div', {
                className: 'form-group'
            });

            const orientationLabel = Utils.createElement('label', {
                className: 'form-label'
            }, '버튼 배열:');

            // 세로 배열 라디오 버튼
            const verticalContainer = Utils.createElement('div', {
                style: { marginBottom: '5px' }
            });

            const verticalRadio = Utils.createElement('input', {
                className: 'form-checkbox',
                id: 'vertical-radio',
                type: 'radio',
                name: 'button-orientation',
	                   onchange: (e) => {
                    if (e.target.checked) {
                        const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                        remoteConfig.orientation = 'vertical';
                        Storage.set('remoteControl', remoteConfig);

                        const remoteControl = document.getElementById('remote-control');
                        if (remoteControl) {
                            remoteControl.style.flexDirection = 'column';
                        }
                    }
                }
            });
                verticalRadio.checked = Storage.get('remoteControl', CONFIG.remoteControl).orientation === 'vertical';

            const verticalLabel = Utils.createElement('label', {
                for: 'vertical-radio'
            }, '세로 배열');

            verticalContainer.appendChild(verticalRadio);
            verticalContainer.appendChild(verticalLabel);

            // 가로 배열 라디오 버튼
            const horizontalContainer = Utils.createElement('div', {
                style: { marginBottom: '5px' }
            });

            const horizontalRadio = Utils.createElement('input', {
                className: 'form-checkbox',
                id: 'horizontal-radio',
                type: 'radio',
                name: 'button-orientation',
                onchange: (e) => {
                    if (e.target.checked) {
                        const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                        remoteConfig.orientation = 'horizontal';
                        Storage.set('remoteControl', remoteConfig);

                        const remoteControl = document.getElementById('remote-control');
                        if (remoteControl) {
                            remoteControl.style.flexDirection = 'row';
                        }
                    }
                }
            });
            horizontalRadio.checked = Storage.get('remoteControl', CONFIG.remoteControl).orientation === 'horizontal';

            const horizontalLabel = Utils.createElement('label', {
                for: 'horizontal-radio'
            }, '가로 배열');

            horizontalContainer.appendChild(horizontalRadio);
            horizontalContainer.appendChild(horizontalLabel);

            orientationGroup.appendChild(orientationLabel);
            orientationGroup.appendChild(verticalContainer);
            orientationGroup.appendChild(horizontalContainer);

            // 아이콘 위치 초기화
            const resetGroup = Utils.createElement('div', {
                className: 'form-group',
                style: { marginTop: '20px' }
            });

            const resetButton = Utils.createElement('button', {
                className: 'form-button',
                onclick: () => {
                    const remoteControl = document.getElementById('remote-control');
                    if (remoteControl) {
                        remoteControl.style.right = CONFIG.remoteControl.position.right;
                        remoteControl.style.bottom = CONFIG.remoteControl.position.bottom;

                        const remoteConfig = Storage.get('remoteControl', CONFIG.remoteControl);
                        remoteConfig.position = { ...CONFIG.remoteControl.position };
                        Storage.set('remoteControl', remoteConfig);
                        Storage.remove('remotePosition');
                    }
                }
            }, '아이콘 위치 초기화');

            resetGroup.appendChild(resetButton);

            section.appendChild(title);
            section.appendChild(sizeGroup);
            section.appendChild(gapGroup);
            section.appendChild(shapeGroup);
            section.appendChild(orientationGroup);
            section.appendChild(resetGroup);

            return section;
        },
                // 이미지 패널 생성
        createImagePanel: function() {
            const imagePanel = Utils.createElement('div', {
                id: 'image-panel',
                className: 'image-panel' // CSS 클래스 적용
            });

            // 헤더
            const header = Utils.createElement('div', {
                className: 'settings-header' // settings-header 클래스 적용
            });

            const title = Utils.createElement('h3', {
                className: 'draggable-handle'
            }, '삽화 생성');

            const closeButton = Utils.createElement('button', {
                className: 'close-button',
                onclick: () => this.toggleImagePanel(false)
            }, '✕');

            header.appendChild(title);
            header.appendChild(closeButton);

            // 스크롤 가능한 내용 영역
            const scrollableContent = Utils.createElement('div', {
                className: 'settings-content' // settings-content 클래스 적용
            });

            // 이미지 컨테이너
            const imageContainer = Utils.createElement('div', {
                className: 'image-container'
            });

            // 이미지
            const image = Utils.createElement('img', {
                className: 'generated-image',
                id: 'generated-image',
                alt: '생성된 삽화'
            });

            // 프롬프트
            const promptText = Utils.createElement('div', {
                className: 'image-prompt',
                id: 'image-prompt-text'
            });

            // 컨트롤
            const controls = Utils.createElement('div', {
                className: 'image-controls'
            });

            const downloadButton = Utils.createElement('button', {
                className: 'form-button',
                id: 'download-button'
            }, '다운로드');

            const regenerateButton = Utils.createElement('button', {
                className: 'form-button',
                id: 'regenerate-button'
            }, '재생성');

            controls.appendChild(downloadButton);
            controls.appendChild(regenerateButton);

            imageContainer.appendChild(image);
            imageContainer.appendChild(promptText);
            imageContainer.appendChild(controls);

            scrollableContent.appendChild(imageContainer);

            imagePanel.appendChild(header);
            imagePanel.appendChild(scrollableContent);

            document.body.appendChild(imagePanel);
        },



        // 설정 탭 전환
        switchSettingsTab: function(tabId) {
            // 모든 탭 비활성화
            document.querySelectorAll('.settings-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // 모든 섹션 숨김
            document.querySelectorAll('.settings-section').forEach(section => {
                section.classList.remove('active');
            });

            // 선택한 탭 활성화
            document.querySelector(`.settings-tab[data-tab="${tabId}"]`).classList.add('active');

            // 선택한 섹션 표시
            document.getElementById(`${tabId}-settings`).classList.add('active');
        },

        // 설정 패널 토글
        toggleSettingsPanel: function(show = null) {
            const panel = document.getElementById('settings-panel');
            if (!panel) return;

            if (show === null) {
                show = panel.style.display === 'none' || panel.style.display === '';
            }

            panel.style.display = show ? 'flex' : 'none';

            if (show) {
                this.updateExtensionVisibility();
                this.updateCssPresets();
                this.updateTransformRules();
                this.extractMainColor();
            }
        },

        // 출력 패널 토글
        toggleOutputPanel: function(show = null) {
            const panel = document.getElementById('output-panel');
            if (!panel) return;

            if (show === null) {
                show = panel.style.display === 'none' || panel.style.display === '';
            }

            panel.style.display = show ? 'flex' : 'none';

            if (show) {
                this.extractMainColor();
            }
        },

        // 이미지 패널 토글
        toggleImagePanel: function(show = null) {
            const panel = document.getElementById('image-panel');
            if (!panel) return;

            if (show === null) {
                show = panel.style.display === 'none' || panel.style.display === '';
            }

            panel.style.display = show ? 'flex' : 'none';

            if (show) {
                this.extractMainColor();
            }
        },

        // 번역 입력 토글
        toggleTranslationInput: function() {
            const container = document.getElementById('translation-input-container');
            if (!container) return;

            const isEnabled = Storage.get('geminiInputEnabled', false);
            container.style.display = isEnabled ? 'block' : 'none';
        },

        // 확장 기능 가시성 업데이트
        updateExtensionVisibility: function() {
            // 요약 버튼 표시/숨김
            const summaryButton = document.getElementById('summary-button');
            if (summaryButton) {
                summaryButton.style.display = Storage.get('geminiSummaryEnabled', false) ? 'block' : 'none';
            }

            // 요약 설정 탭 표시/숨김
            const summaryTab = document.querySelector('.settings-tab[data-tab="summary"]');
            if (summaryTab) {
                summaryTab.style.display = Storage.get('geminiSummaryEnabled', false) ? 'block' : 'none';
            }

            // 삽화 설정 탭 표시/숨김
            const imageTab = document.querySelector('.settings-tab[data-tab="image"]');
            if (imageTab) {
                imageTab.style.display = Storage.get('imageGenerationEnabled', false) ? 'block' : 'none';
            }

            // CSS 설정 탭 표시/숨김
            const cssTab = document.querySelector('.settings-tab[data-tab="css"]');
            if (cssTab) {
                cssTab.style.display = Storage.get('cssEnabled', false) ? 'block' : 'none';
            }

            // 변환 설정 탭 표시/숨김
            const transformTab = document.querySelector('.settings-tab[data-tab="transform"]');
            if (transformTab) {
                transformTab.style.display = Storage.get('transformEnabled', false) ? 'block' : 'none';
            }
        },

        // CSS 프리셋 목록 업데이트
        updateCssPresets: function() {
            const presetsList = document.getElementById('css-presets-list');
            if (!presetsList) return;

            presetsList.innerHTML = '';

            const presets = Features.CssPreset.getPresets();
            const activeIndex = Features.CssPreset.getActiveIndex();

            presets.forEach((preset, index) => {
                const presetContainer = Utils.createElement('div', {
                    className: 'preset-container',
                    style: {
                        color: index === activeIndex ? 'var(--highlight-color)' : 'inherit'
                    }
                });

                const presetName = Utils.createElement('button', {
                    className: 'form-button preset-name',
                    onclick: () => {
                        Features.CssPreset.applyPreset(index);
                        this.updateCssPresets();
                    }
                }, preset.name);

                const editButton = Utils.createElement('button', {
                    className: 'form-button',
                    onclick: () => {
                        Features.CssPreset.editPreset(index);
                        this.updateCssPresets();
                    }
                }, '편집');

                presetContainer.appendChild(presetName);
                presetContainer.appendChild(editButton);

                presetsList.appendChild(presetContainer);
            });
        },

        // 변환 규칙 목록 업데이트
        updateTransformRules: function() {
            const rulesList = document.getElementById('transform-rules-list');
            if (!rulesList) return;

            rulesList.innerHTML = '';

            const rules = Features.Transform.getRules();

            rules.forEach((rule, index) => {
                const ruleContainer = Utils.createElement('div', {
                    className: 'transform-rule'
                });

                const statusCheckbox = Utils.createElement('input', {
                    className: 'form-checkbox',
                    type: 'checkbox',
                    onchange: (e) => {
                        Features.Transform.updateRuleStatus(index, e.target.checked);
                    }
                });
                    statusCheckbox.checked = rule.status;
                const beforeInput = Utils.createElement('input', {
                    className: 'transform-input',
                    type: 'text',
                    value: rule.before,
                    oninput: (e) => {
                        Features.Transform.updateRuleBefore(index, e.target.value);
                    }
                });

                const afterInput = Utils.createElement('input', {
                    className: 'transform-input',
                    type: 'text',
                    value: rule.after,
                    oninput: (e) => {
                        Features.Transform.updateRuleAfter(index, e.target.value);
                    }
                });

                const deleteButton = Utils.createElement('button', {
                    className: 'form-button',
                    onclick: () => {
                        Features.Transform.deleteRule(index);
                        this.updateTransformRules();
                    }
                }, '삭제');

                ruleContainer.appendChild(statusCheckbox);
                ruleContainer.appendChild(beforeInput);
                ruleContainer.appendChild(afterInput);
                ruleContainer.appendChild(deleteButton);

                rulesList.appendChild(ruleContainer);
            });
        },

        // 텍스트 스타일 업데이트
        updateTextStyle: function() {
            const italicActive = Storage.get('ns-italic', false);
            const boldActive = Storage.get('ns-bold', false);
            const highlightActive = Storage.get('ns-highlight', false);
            const colorCode = Storage.get('colorCode', CONFIG.defaultHighlightColor);

            const newItalic = italicActive ? 'italic' : 'normal';
            const newBold = boldActive ? 'bold' : 'normal';
            const newColor = highlightActive ? colorCode : 'inherit';

            document.documentElement.style.setProperty('--italic-active', newItalic);
            document.documentElement.style.setProperty('--bold-active', newBold);
            document.documentElement.style.setProperty('--text-highlight-color', newColor);
        },

        // 메인 색상 추출
        extractMainColor: function() {
            const infobarElement = document.querySelector('.menubar');
            if (infobarElement) {
                const mainColor = window.getComputedStyle(infobarElement).backgroundColor;
                document.documentElement.style.setProperty('--main-color', mainColor);
                Storage.set('tMainColor', mainColor);
            }
        }
    };

    // ======================== 5. 기능별 모듈 ========================
    const Features = {
        // 번역 기능
        Translation: {
            prevText: '',
            prevTrans: '',
            dplC: 0,

            /**
             * 텍스트 추출 및 번역
             */
            extractAndTranslate: function(buttonElement) {
                UI.toggleOutputPanel(true);
                this.extractText(Storage.get('textExtraction', CONFIG.defaultTextExtraction), 'translate', buttonElement);
            },

            /**
             * 장문 텍스트 추출
             */
            extractLongText: function(buttonElement) {
                this.loadAllContent().then(() => {
                    this.extractText(Storage.get('longExtraction', '1000000'), 'translate', buttonElement);
                });
            },

            /**
             * 전체 컨텐츠 로드
             * @returns {Promise} 로드 완료 Promise
             */
            loadAllContent: async function() {
                const proseMirrorDiv = document.querySelector('.conversation-main');

                if (!proseMirrorDiv) {
                    console.log('ProseMirror element not found');
                    return;
                }

                try {
                    let previousHeight = proseMirrorDiv.scrollHeight;
                    let attempts = 0;
                    const maxAttempts = 20;

                    while (attempts < maxAttempts) {
                        // 스크롤을 최상단으로 강제 이동
                        proseMirrorDiv.scrollTop = 0;

                        // 스크롤 이벤트 발생시키기
                        proseMirrorDiv.dispatchEvent(new Event('scroll'));

                        // 새로운 컨텐츠가 로딩될 시간 대기
                        await new Promise(resolve => setTimeout(resolve, 900));

                        // 높이 변화가 없다면 모든 컨텐츠가 로딩된 것
                        if (proseMirrorDiv.scrollHeight === previousHeight) {
                            // 한번 더 확인을 위해 추가 대기
                            await new Promise(resolve => setTimeout(resolve, 1200));
                            if (proseMirrorDiv.scrollHeight === previousHeight) {
                                break;
                            }
                        }

                        previousHeight = proseMirrorDiv.scrollHeight;
                        attempts++;
                    }

                    // 모든 컨텐츠 로딩이 완료된 후 스크롤을 최하단으로 이동
                    proseMirrorDiv.scrollTop = proseMirrorDiv.scrollHeight;
                } catch (error) {
                    console.error('Error loading content:', error);
                }
            },

            /**
             * 텍스트 추출
             * @param {number} length - 추출할 텍스트 길이
             * @param {string} mode - 모드 ('translate', 'summary', 'imagePrompt')
             */
            extractText: function(length, mode = 'translate', buttonElement) {
                const proseMirrorDiv = document.querySelector('.ProseMirror');
                const paragraphs = proseMirrorDiv.querySelectorAll('p');
                let pText = '';

                for (let i = paragraphs.length - 1; i >= 0; i--) {
                    const paragraphText = paragraphs[i].textContent;
                    pText = paragraphText + '\n' + pText;
                    if (pText.length >= length) {
                        break;
                    }
                }

                // 번역, 요약, 또는 삽화 프롬프트 생성 로직
                if (Storage.get('dplD', false) ||
                    mode === 'summary' ||
                    Storage.get('geminiDefault', false) ||
                    this.dplC !== 0 ||
                    mode === 'imagePrompt') {

                    if (mode === 'summary') {
                        this.sendGeminiRequest(pText, 'summary', (summaryText) => {
                            pText = summaryText;
                            this.continueProcessing(pText);
                        }, buttonElement);
                    } else if (mode === 'imagePrompt') {
                        this.sendGeminiRequest(pText, 'imagePrompt', (imagePrompt) => {
                            Features.Image.generateImageWithNovelAI(imagePrompt, buttonElement);
                        }, buttonElement);
                    } else if (Storage.get('geminiDefault', false)) {
                        this.sendGeminiRequest(pText, 'translate', (translatedText) => {
                            this.prevText = pText;
                            pText = translatedText;
                            this.prevTrans = pText;
                            this.continueProcessing(pText);
                        }, buttonElement);
                    } else {
                        this.translateWithDeepL(pText, (translatedText) => {
                            this.prevText = pText;
                            pText = translatedText;
                            this.prevTrans = pText;
                            this.continueProcessing(pText);
                        }, buttonElement);
                    }
                } else {
                    this.continueProcessing(pText);
                }
            },

            /**
             * 추출 후 처리 계속
             * @param {string} pText - 처리할 텍스트
             */
            continueProcessing: function(pText) {
                UI.updateTextStyle();

                // 대사 강조
                const pattern = /"([^"]+)"/g;
                let newText = pText.replace(pattern, '<span class="highlight-text">"$1"</span>');

                // HTML 형식으로 변환
                pText = '<p class="nm">' + newText.replace(/\n/g, '</p><p class="nm">') + '</p>';

                // 제목 변환 (## 제목 => <h2>제목</h2>)
                pText = pText.replace(/^## (.*$)/gm, "<h2>$1</h2>");
                pText = pText.replace(/^# (.*$)/gm, "<h1>$1</h1>");

                // 굵은 글씨 변환 (**텍스트** -> <b>텍스트</b>)
                pText = pText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

                // 리스트 변환 (- 항목 -> <ul><li>항목</li></ul>)
                pText = pText.replace(/^- (.*)$/gm, "<ul><li>$1</li></ul>");

                // 여러 개의 <ul> 태그가 연속될 경우 하나로 합침
                pText = pText.replace(/<\/ul>\n<ul>/g, "");

                const extractedText = document.getElementById('extracted-text');
                extractedText.innerHTML = pText;

                // 변환 규칙 적용
                if (Storage.get('tfStat', false)) {
                    this.applyTransformRules();
                }

                this.dplC = 0;
            },

            /**
             * 변환 규칙 적용
             */
            applyTransformRules: function() {
                const extractedText = document.getElementById('extracted-text');
                extractedText.setAttribute('translate', 'no');

                let textContent = extractedText.innerHTML;
                const tfStock = Features.Transform.getRules();

                tfStock.forEach(function(rule) {
                    if (rule.status) {
                        const beforeText = rule.before;
                        const afterText = rule.after;

                        // 정규 표현식: 단어와 조사를 분리하여 캡처
                        const regex = new RegExp('(' + beforeText + ')(은|는|이|가|을|를|와|과)?', 'g');

                        textContent = textContent.replace(regex, function(match, word, particle) {
                            const lastChar = afterText.charCodeAt(afterText.length - 1);
                            const hasBatchim = (lastChar - 0xAC00) % 28 !== 0;

                            let newParticle = '';
                            if (particle) {
                                if (particle === '은' || particle === '는') {
                                    newParticle = hasBatchim ? '은' : '는';
                                } else if (particle === '이' || particle === '가') {
                                    newParticle = hasBatchim ? '이' : '가';
                                } else if (particle === '을' || particle === '를') {
                                    newParticle = hasBatchim ? '을' : '를';
                                } else if (particle === '와' || particle === '과') {
                                    newParticle = hasBatchim ? '과' : '와';
                                }
                            }

                            return afterText + newParticle;
                        });
                    }
                });

                extractedText.innerHTML = textContent;
            },

            /**
             * DeepL로 번역
             * @param {string} text - 번역할 텍스트
             * @param {Function} callback - 콜백 함수
             */
            translateWithDeepL: function(text, callback, buttonElement) {
                Utils.toggleLoading(true, buttonElement);

                const apiUrl = "https://api-free.deepl.com/v2/translate";
                const requestData = {
                    auth_key: Storage.get('dplApi', ''),
                    text: text,
                    source_lang: "EN",
                    target_lang: "KO",
                };

                fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: Object.entries(requestData)
                        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                        .join("&"),
                })
                .then((response) => response.json())
                .then((data) => {
                    if (data.translations && data.translations.length > 0) {
                        const translatedText = data.translations[0].text;
                        callback(translatedText);
                    } else {
                        console.error("Translation failed. Response:", data);
                        callback("응답이 돌아오지 않았습니다.");
                    }
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    callback("잘못된 api입니다.");
                })
                .finally(() => {
                    Utils.toggleLoading(false, buttonElement);
                });
            },

            /**
             * Gemini API 요청 전송
             * @param {string} text - 처리할 텍스트
             * @param {string} mode - 요청 모드 ('translate', 'ko-en', 'summary', 'imagePrompt')
             * @param {Function} callback - 콜백 함수
             */
            sendGeminiRequest: async function(text, mode, callback, buttonElement) {
                Utils.toggleLoading(true, buttonElement);

                const selectedModel = Storage.get('geminiModel', CONFIG.defaultGeminiModel);
                const apiKey = Storage.get('geminiApi', '');
                let prompt;

                switch (mode) {
                    case 'translate':
                        prompt = Storage.get('geminiPrompt', CONFIG.defaultGeminiPrompt);
                        break;
                    case 'ko-en':
                        const engContext = this.getEngContext();
                        prompt = Storage.get('geminiKoEnPrompt', CONFIG.defaultGeminiKoEnPrompt);
                        text = `직전 문맥: ${engContext}\n번역할 텍스트: ${text}`;
                        break;
                    case 'summary':
                        prompt = Storage.get('geminiSummaryPrompt', CONFIG.defaultGeminiSummaryPrompt);
                        break;
                    case 'imagePrompt':
                        prompt = Storage.get('imagePrompt', CONFIG.defaultImagePrompt);
				text = `${text}(삽화 삽입 지점)\n${prompt}`;
				prompt = '';
                        break;
                    default:
                        prompt = '다음 텍스트를 처리해주세요.';
                }

                const safetySettings = Object.values({
                    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
                    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
                    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
                }).map(category => ({
                    category: category,
                    threshold: selectedModel === 'gemini-2.0-flash-exp' ? 'OFF' : 'BLOCK_NONE',
                }));

                // Gemini 프리셋에서 가져온 값 사용
                const temperature = parseFloat(Storage.get('geminiTemperature', '0.6'));
                const topK = parseInt(Storage.get('geminiTopK', '10'));
                const topP = parseFloat(Storage.get('geminiTopP', '0.99'));

                try {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `${prompt}\n\n${text}`
                                    }]
                                }],
                                generationConfig: {
                                    temperature: temperature,
                                    topK: topK,
                                    topP: topP,
                                },
                                safetySettings: safetySettings
                            })
                        }
                    );

                    if (!response.ok) {
                        let errorText = await response.text();
                        throw new Error(`Gemini API 요청 실패: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    if (data.candidates && data.candidates.length > 0) {
                        const resultText = data.candidates[0].content.parts[0].text;
                        callback(resultText);
                    } else if (data.promptFeedback) {
                        console.error("요청 실패 (promptFeedback):", data.promptFeedback);
                        callback("요청이 차단되었습니다: " + JSON.stringify(data.promptFeedback));
                    } else {
                        let errorText = await response.text();
                        console.error("요청 실패. 응답:", data, "전체 응답 텍스트:", errorText);
                        callback("응답이 돌아오지 않았습니다.");
                    }
                } catch (error) {
                    console.error("요청 오류:", error);
                    callback("API 오류가 발생했습니다. 상세: " + error.message);
                } finally {
                if (mode !== 'imagePrompt') {
    Utils.toggleLoading(false, buttonElement);
}
                }
            },

            /**
             * 영어 컨텍스트 가져오기
             * @returns {string} 영어 컨텍스트
             */
            getEngContext: function() {
                const proseMirrorDiv = document.querySelector('.ProseMirror');
                const paragraphs = proseMirrorDiv.querySelectorAll('p');
                let pText = '';

                for (let i = paragraphs.length - 1; i >= 0; i--) {
                    const paragraphText = paragraphs[i].textContent;
                    pText = paragraphText + '\n' + pText;
                    if (pText.length >= 4000) {
                        break;
                    }
                }

                return pText;
            },

            /**
             * 한국어를 영어로 번역
             * @param {string} text - 번역할 한국어 텍스트
             * @returns {Promise<string>} 번역된 영어 텍스트
             */
            translateKoToEn: async function(text) {
                return new Promise((resolve) => {
                    this.sendGeminiRequest(text, 'ko-en', function(translatedText) {
                        resolve(translatedText);
                    });
                });
            }
        },

        // 요약 기능
        Summary: {
            /**
             * 요약 생성
             */
            generateSummary: function(buttonElement) {
                Features.Translation.loadAllContent().then(() => {
                    Features.Translation.extractText('9999999999', 'summary', buttonElement);
                });
            }
        },

        // 삽화 생성 기능
        Image: {
            currentImageUrl: null,
            currentImageName: null,
            currentPrompt: null,

            /**
             * 삽화 생성
             */
            generateImage: function(buttonElement) {
                Features.Translation.extractText(6000, 'imagePrompt', buttonElement);
            },

            /**
             * NovelAI API 상태 확인
             * @param {string} apiKey - NovelAI API 키
             */
            checkApiStatus: async function(apiKey) {
                const statusIndicator = document.getElementById('novelai-api-status');
                if (!statusIndicator) return;

                statusIndicator.style.backgroundColor = 'gray';

                if (!apiKey) return;

                try {
                    const response = await fetch('https://api.novelai.net/user/subscription', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    statusIndicator.style.backgroundColor = response.ok ? 'green' : 'red';
                } catch (error) {
                    console.error("NovelAI API status check error:", error);
                    statusIndicator.style.backgroundColor = 'red';
                }
            },
/**
 * NovelAI로 이미지 생성 (기존 구조 유지)
 * @param {string} imagePrompt - 이미지 프롬프트
 */
generateImageWithNovelAI: async function(imagePrompt, buttonElement) {
    Utils.toggleLoading(true, buttonElement);

    try {
        // JSZip 로드
        const JSZip = await Utils.loadJSZip();

        const apiKey = Storage.get('novelaiApiKey', '');
        const mainPrompt = Storage.get('mainPrompt', CONFIG.defaultMainPrompt);
        const ucPrompt = Storage.get('ucPrompt', CONFIG.defaultUcPrompt);
        const imageSize = Storage.get('imageSize', 'Portrait');

        // 설정 창에서 최신 값 가져오기
        const model = Storage.get('imageModel', CONFIG.imageGeneration.model);
        const sampler = Storage.get('imageSampler', CONFIG.imageGeneration.sampler);
        const scheduler = Storage.get('imageScheduler', CONFIG.imageGeneration.scheduler);
        const steps = parseInt(Storage.get('imageSteps', CONFIG.imageGeneration.steps));
        const scale = parseFloat(Storage.get('imageScale', CONFIG.imageGeneration.scale));
        const sm = Storage.get('imageSm', CONFIG.imageGeneration.sm);
        const sm_dyn = Storage.get('imageSmDyn', CONFIG.imageGeneration.sm_dyn);
        const decrisper = Storage.get('imageDecrisper', CONFIG.imageGeneration.decrisper);

        // 이미지 크기에 따른 width, height 설정
        let width, height;
        switch (imageSize) {
            case 'Portrait':
                width = 832;
                height = 1216;
                break;
            case 'Landscape':
                width = 1216;
                height = 832;
                break;
            case 'Square':
                width = 1024;
                height = 1024;
                break;
        }

        const requestData = {
            action: 'generate',
            model: model,
            parameters: {
                width: width,
                height: height,
                scale: scale,
                sampler: sampler,
                steps: steps,
                seed: Math.floor(Math.random() * 9999999999),
                n_samples: 1,
                
                legacy: false, 
                noise_schedule: scheduler,
                
                // 추가 파라미터 적용
                sm: sm,
                sm_dyn: sm_dyn,
                decrisper: decrisper,

                ucPreset: 1,
                v4_prompt: {
                    caption: {
                        base_caption: `${mainPrompt}, ${imagePrompt}`,
                        char_captions: [],
                    },
                    use_coords: false,
                    use_order: true,
                },
                v4_negative_prompt: {
                    caption: {
                        base_caption: ucPrompt,
                        char_captions: [],
                    },
                },
            }
        };

        const response = await fetch('https://image.novelai.net/ai/generate-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'accept': 'application/x-zip-compressed'
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`NovelAI API 호출 실패: ${response.status} - ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        let imageBlob = null;
        let imageName = null;
        let foundImage = false;

        for (const filename of Object.keys(zip.files)) {
            if (filename.toLowerCase().endsWith('.png')) {
                imageBlob = await zip.files[filename].async('blob');
                imageName = filename;
                foundImage = true;
                break;
            }
        }

        if (!foundImage) {
            throw new Error('ZIP 파일 내에서 PNG 이미지를 찾을 수 없습니다.');
        }

        const imageUrl = URL.createObjectURL(imageBlob);
        this.displayImage(imageUrl, imagePrompt, imageName);

    } catch (error) {
        console.error("NovelAI API 호출 오류:", error);
        alert("삽화 생성 중 오류가 발생했습니다. 상세 오류: " + error.message);
    } finally {
        Utils.toggleLoading(false, buttonElement);
    }
},

            /**
             * 생성된 이미지 표시
             * @param {string} imageUrl - 이미지 URL
             * @param {string} imagePrompt - 이미지 프롬프트
             * @param {string} imageName - 이미지 파일명
             */
            displayImage: function(imageUrl, imagePrompt, imageName = 'generated_image.png') {
                // 이전 이미지 URL 해제
                if (this.currentImageUrl) {
                    URL.revokeObjectURL(this.currentImageUrl);
                }
                const title = document.querySelector('[aria-label="Story Title"]')?.value || '';
const dateTime = new Date().toISOString().slice(0, 10).replace(/-/g, '') + new Date().toTimeString().slice(0, 5).replace(':', '');

imageName = `${title}${dateTime}.png`;

                // 현재 이미지 정보 저장
                this.currentImageUrl = imageUrl;
                this.currentImageName = imageName;
                this.currentPrompt = imagePrompt;

                // 이미지 패널 요소 가져오기
                const imagePanel = document.getElementById('image-panel');
                const image = document.getElementById('generated-image');
                const promptText = document.getElementById('image-prompt-text');
                const downloadButton = document.getElementById('download-button');
                const regenerateButton = document.getElementById('regenerate-button');

                // 이미지 및 프롬프트 설정
                image.src = imageUrl;
                promptText.textContent = imagePrompt;

                // 다운로드 버튼 이벤트
                downloadButton.onclick = () => {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = imageName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };

                // 재생성 버튼 이벤트
                regenerateButton.onclick = (e) => {
    const clickedButton = e.currentTarget;
                    this.generateImageWithNovelAI(imagePrompt, clickedButton);
                };

                // 이미지 패널 표시
                UI.toggleImagePanel(true);
            }
        },

        // CSS 프리셋 기능
        CssPreset: {
            /**
             * 프리셋 가져오기
             * @returns {Array} CSS 프리셋 배열
             */
            getPresets: function() {
                return Storage.get('cssStock', []);
            },

            /**
             * 활성 프리셋 인덱스 가져오기
             * @returns {number} 활성 프리셋 인덱스
             */
            getActiveIndex: function() {
                return parseInt(Storage.get('selectedCssIndex', -1));
            },

            /**
             * 프리셋 추가
             */
            addPreset: function() {
                const presets = this.getPresets();

                const newPreset = {
                    name: "프리셋 이름",
                    css: "CSS 코드"
                };

                presets.push(newPreset);
                Storage.set('cssStock', presets);

                this.editPreset(presets.length - 1);
            },

            /**
             * 프리셋 편집
             * @param {number} index - 프리셋 인덱스
             */
            editPreset: function(index) {
                const presets = this.getPresets();

                if (index < 0 || index >= presets.length) return;

                // 편집 창 생성
                const editorDiv = Utils.createElement('div', {
                    id: 'css-editor',
                    style: {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: '10001',
                        backgroundColor: 'var(--main-color)',
                        padding: '15px',
                        width: '80%',
                        maxWidth: '600px',
                        backdropFilter: 'blur(30px)'
                    }
                });

                // 헤더
                const header = Utils.createElement('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                    }
                });

                const title = Utils.createElement('h3', {}, '프리셋 편집');

                const closeButton = Utils.createElement('button', {
                    className: 'close-button',
                    onclick: () => editorDiv.remove()
                }, '✕');

                header.appendChild(title);
                header.appendChild(closeButton);

                // 이름 입력
                const nameGroup = Utils.createElement('div', {
                    className: 'form-group'
                });

                const nameLabel = Utils.createElement('label', {
                    className: 'form-label',
                    for: 'css-name'
                }, '프리셋 이름:');

                const nameInput = Utils.createElement('input', {
                    className: 'form-input',
                    id: 'css-name',
                    type: 'text',
                    value: presets[index].name
                });

                nameGroup.appendChild(nameLabel);
                nameGroup.appendChild(nameInput);

                // CSS 코드 입력
                const codeGroup = Utils.createElement('div', {
                    className: 'form-group'
                });

                const codeLabel = Utils.createElement('label', {
                    className: 'form-label',
                    for: 'css-code'
                }, 'CSS 코드:');

                const codeTextarea = Utils.createElement('textarea', {
                    className: 'form-textarea',
                    id: 'css-code',
                    style: { minHeight: '200px' }
                }, presets[index].css);

                codeGroup.appendChild(codeLabel);
                codeGroup.appendChild(codeTextarea);

                // 버튼 그룹
                const buttonGroup = Utils.createElement('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '15px'
                    }
                });

                const deleteButton = Utils.createElement('button', {
                    className: 'form-button',
                    style: { backgroundColor: '#f44336' },
                    onclick: () => {
                        if (confirm('정말로 삭제하시겠습니까?')) {
                            presets.splice(index, 1);
                            Storage.set('cssStock', presets);

                            // 활성 프리셋이 삭제된 경우 처리
                            if (this.getActiveIndex() === index) {
                                Storage.set('selectedCssIndex', -1);
                                this.removeActivePreset();
                            }

                            UI.updateCssPresets();
                            editorDiv.remove();
                        }
                    }
                }, '삭제');

                const saveButton = Utils.createElement('button', {
                    className: 'form-button',
                    onclick: () => {
                        presets[index] = {
                            name: nameInput.value,
                            css: codeTextarea.value
                        };

                        Storage.set('cssStock', presets);

                        // 활성 프리셋이 수정된 경우 적용
                        if (this.getActiveIndex() === index) {
                            this.applyPreset(index);
                        }

                        UI.updateCssPresets();
                        editorDiv.remove();
                    }
                }, '저장');

                buttonGroup.appendChild(deleteButton);
                buttonGroup.appendChild(saveButton);

                editorDiv.appendChild(header);
                editorDiv.appendChild(nameGroup);
                editorDiv.appendChild(codeGroup);
                editorDiv.appendChild(buttonGroup);

                document.body.appendChild(editorDiv);

            },

            /**
             * 프리셋 적용
             * @param {number} index - 프리셋 인덱스
             */
            applyPreset: function(index) {
                const presets = this.getPresets();

                if (index < 0 || index >= presets.length) return;

                // 기존 스타일 시트 제거
                this.removeActivePreset();

                // 새 스타일 시트 추가
                const styleElement = document.createElement('style');
                styleElement.id = 'custom-css-preset';
                styleElement.textContent = presets[index].css;
                document.head.appendChild(styleElement);

                // 활성 인덱스 저장
                Storage.set('selectedCssIndex', index);
            },

            /**
             * 활성 프리셋 제거
             */
            removeActivePreset: function() {
                const styleElement = document.getElementById('custom-css-preset');
                if (styleElement) {
                    styleElement.remove();
                }
            },

            /**
             * 프리셋 백업
             */
            backupPresets: function() {
                const presets = this.getPresets();
                const backupData = JSON.stringify(presets, null, 2);
                Utils.copyToClipboard(backupData);
                alert('CSS 프리셋이 클립보드에 복사되었습니다.');
            },

            /**
             * 프리셋 가져오기
             */
            importPresets: function() {
                // 가져오기 창 생성
                const importDiv = Utils.createElement('div', {
                    id: 'css-import',
                    style: {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: '10001',
                        backgroundColor: 'var(--main-color)',
                        padding: '15px',
                        width: '80%',
                        maxWidth: '600px',
                        backdropFilter: 'blur(30px)'
                    }
                });

                // 헤더
                const header = Utils.createElement('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                    }
                });

                const title = Utils.createElement('h3', {}, '백업 프리셋 가져오기');

                const closeButton = Utils.createElement('button', {
                    className: 'close-button',
                    onclick: () => importDiv.remove()
                }, '✕');

                header.appendChild(title);
                header.appendChild(closeButton);

                // 백업 데이터 입력
                const dataGroup = Utils.createElement('div', {
                    className: 'form-group'
                });

                const dataLabel = Utils.createElement('label', {
                    className: 'form-label',
                    for: 'css-backup-data'
                }, '백업 데이터:');

                const dataTextarea = Utils.createElement('textarea', {
                    className: 'form-textarea',
                    id: 'css-backup-data',
                    style: { minHeight: '200px' }
                });

                const dataHelp = Utils.createElement('small', {}, '백업으로 복사된 내용을 붙여넣기하세요.');

                dataGroup.appendChild(dataLabel);
                dataGroup.appendChild(dataTextarea);
                dataGroup.appendChild(dataHelp);

                // 버튼 그룹
                const buttonGroup = Utils.createElement('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '15px'
                    }
                });

                const importButton = Utils.createElement('button', {
                    className: 'form-button',
                    onclick: () => {
                        const backupData = dataTextarea.value.trim();

                        if (!backupData) {
                            alert('백업 데이터를 입력하세요.');
                            return;
                        }

                        try {
                            const presets = JSON.parse(backupData);

                            if (!Array.isArray(presets)) {
                                throw new Error('유효한 프리셋 데이터가 아닙니다.');
                            }

                            if (confirm('기존 프리셋을 모두 덮어쓰시겠습니까?')) {
                                Storage.set('cssStock', presets);
                                UI.updateCssPresets();
                                importDiv.remove();
                            }
                        } catch (error) {
                            alert('유효한 JSON 데이터가 아닙니다: ' + error.message);
                        }
                    }
                }, '가져오기');

                buttonGroup.appendChild(importButton);

                importDiv.appendChild(header);
                importDiv.appendChild(dataGroup);
                importDiv.appendChild(buttonGroup);

                document.body.appendChild(importDiv);

            }
        },

        // 변환 기능
        Transform: {
            /**
             * 변환 규칙 가져오기
             * @returns {Array} 변환 규칙 배열
             */
            getRules: function() {
                return Storage.get('tfStock', []);
            },

            /**
             * 규칙 추가
             * @param {string} before - 변환 전 텍스트
             * @param {string} after - 변환 후 텍스트
             */
            addRule: function(before, after) {
                const rules = this.getRules();

                const newRule = {
                    status: true,
                    before: before,
                    after: after
                };

                rules.push(newRule);
                Storage.set('tfStock', rules);
            },

            /**
             * 규칙 상태 업데이트
             * @param {number} index - 규칙 인덱스
             * @param {boolean} status - 규칙 상태
             */
            updateRuleStatus: function(index, status) {
                const rules = this.getRules();

                if (index < 0 || index >= rules.length) return;

                rules[index].status = status;
                Storage.set('tfStock', rules);
            },

            /**
             * 규칙 변환 전 텍스트 업데이트
             * @param {number} index - 규칙 인덱스
             * @param {string} before - 변환 전 텍스트
             */
            updateRuleBefore: function(index, before) {
                const rules = this.getRules();

                if (index < 0 || index >= rules.length) return;

                rules[index].before = before;
                Storage.set('tfStock', rules);
            },

            /**
             * 규칙 변환 후 텍스트 업데이트
             * @param {number} index - 규칙 인덱스
             * @param {string} after - 변환 후 텍스트
             */
            updateRuleAfter: function(index, after) {
                const rules = this.getRules();

                if (index < 0 || index >= rules.length) return;

                rules[index].after = after;
                Storage.set('tfStock', rules);
            },

            /**
             * 규칙 삭제
             * @param {number} index - 규칙 인덱스
             */
            deleteRule: function(index) {
                const rules = this.getRules();

                if (index < 0 || index >= rules.length) return;

                rules.splice(index, 1);
                Storage.set('tfStock', rules);
            }
        }
    };

    // ======================== 6. 초기화 함수 ========================
    function initialize() {
        // UI 초기화
        UI.init();

        // CSS 프리셋 적용 (저장된 것이 있다면)
        const activeIndex = Features.CssPreset.getActiveIndex();
        if (activeIndex >= 0) {
            Features.CssPreset.applyPreset(activeIndex);
        }

        // NovelAI API 상태 확인
        setTimeout(() => {
            Features.Image.checkApiStatus(Storage.get('novelaiApiKey', ''));
        }, 1000);
    }

    // 스크립트 실행
    initialize();
})();
