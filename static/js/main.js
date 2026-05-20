document.addEventListener('DOMContentLoaded', () => {
    // Navigation elements
    const sidebarHome = document.getElementById('sidebar-home');
    const sidebarHistory = document.getElementById('sidebar-history');
    const sidebarResults = document.getElementById('sidebar-results');
    const headerBtnHistory = document.getElementById('header-btn-history');
    const headerBtnCompose = document.getElementById('header-btn-compose');
    const tabTitle = document.getElementById('tab-title');
    
    const homeSection = document.getElementById('home-section');
    const historySection = document.getElementById('history-section');
    const resultsSection = document.getElementById('results-section');
    
    // Form & Input elements
    const emotionForm = document.getElementById('emotion-form');
    const textInput = document.getElementById('text-input');
    const resultContainer = document.getElementById('result-container');
    const noResultsPlaceholder = document.getElementById('no-results-placeholder');
    
    // Result details elements
    const emotionBadge = document.getElementById('emotion-badge');
    const analyzedText = document.getElementById('analyzed-text');
    const barsList = document.getElementById('bars-list');
    const emotionGraph = document.getElementById('emotion-graph');
    
    // History elements
    const historyList = document.getElementById('history-list');
    const noHistory = document.getElementById('no-history');
    const historySearch = document.getElementById('history-search');
    const historyEmotionFilter = document.getElementById('history-emotion-filter');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    const loadSampleBtn = document.getElementById('load-sample-btn');
    
    const presetFast = document.getElementById('preset-fast');
    const presetIndepth = document.getElementById('preset-indepth');
    const presetMagic = document.getElementById('preset-magic');
    const presetHolistic = document.getElementById('preset-holistic');

    let cachedHistory = [];
    let lastProbabilities = null;
    let interactiveChartInstance = null;

    // Modal elements
    const chartModal = document.getElementById('chart-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const interactiveCanvas = document.getElementById('interactive-canvas');

    // --- Sample Hindi Sentences Array ---
    const sampleSentences = [
        "आज मैं बहुत खुश हूँ, मुझे अपनी मनपसंद नौकरी मिल गई!",
        "तुमने मेरा काम फिर से खराब कर दिया, मुझे बहुत गुस्सा आ रहा है!",
        "अरे वाह! यह तो बहुत बड़ा आश्चर्य है, मैंने ऐसा कभी नहीं सोचा था।",
        "इस दुखद खबर को सुनकर मेरा मन उदास हो गया है, बहुत दुख हुआ।",
        "आज की सुबह बहुत शांत है और मैं खिड़की के बाहर बाग देख रहा हूँ।"
    ];

    // --- Navigation Logic ---
    function showHomeTab() {
        sidebarHome.classList.add('active');
        sidebarHistory.classList.remove('active');
        sidebarResults.classList.remove('active');
        homeSection.classList.add('active');
        homeSection.classList.remove('hidden');
        historySection.classList.remove('active');
        historySection.classList.add('hidden');
        resultsSection.classList.remove('active');
        resultsSection.classList.add('hidden');
        tabTitle.textContent = "Bhaav AI Workspace";
    }

    function showHistoryTab() {
        sidebarHistory.classList.add('active');
        sidebarHome.classList.remove('active');
        sidebarResults.classList.remove('active');
        historySection.classList.add('active');
        historySection.classList.remove('hidden');
        homeSection.classList.remove('active');
        homeSection.classList.add('hidden');
        resultsSection.classList.remove('active');
        resultsSection.classList.add('hidden');
        tabTitle.textContent = "Analysis History Logs";
        fetchHistory();
    }

    function showResultsTab() {
        sidebarResults.classList.add('active');
        sidebarHome.classList.remove('active');
        sidebarHistory.classList.remove('active');
        resultsSection.classList.add('active');
        resultsSection.classList.remove('hidden');
        homeSection.classList.remove('active');
        homeSection.classList.add('hidden');
        historySection.classList.remove('active');
        historySection.classList.add('hidden');
        tabTitle.textContent = "Analysis Results";
    }

    sidebarHome.addEventListener('click', showHomeTab);
    sidebarHistory.addEventListener('click', showHistoryTab);
    sidebarResults.addEventListener('click', showResultsTab);
    
    headerBtnHistory.addEventListener('click', showHistoryTab);
    headerBtnCompose.addEventListener('click', () => {
        showHomeTab();
        textInput.value = '';
        textInput.focus();
        resultContainer.classList.add('hidden');
        noResultsPlaceholder.classList.remove('hidden');
    });



    // Load random Hindi sample text
    loadSampleBtn.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * sampleSentences.length);
        textInput.value = sampleSentences[randomIndex];
        textInput.focus();
        // Visual indicator that text was loaded
        textInput.style.backgroundColor = 'rgba(6, 182, 212, 0.03)';
        setTimeout(() => {
            textInput.style.backgroundColor = 'transparent';
        }, 300);
    });

    // --- Preset Click Handlers ---
    presetFast.addEventListener('click', () => {
        textInput.value = "आज का दिन बहुत ही खूबसूरत और शानदार है, सब लोग काफी प्रसन्न हैं!";
        textInput.focus();
    });

    presetIndepth.addEventListener('click', () => {
        textInput.value = "मुझे यह बिल्कुल पसंद नहीं आया, तुम लोगों ने हमेशा की तरह काम बिगाड़ दिया।";
        textInput.focus();
    });

    presetMagic.addEventListener('click', () => {
        textInput.value = "अरे! क्या ऐसा भी हो सकता है? यह तो बिल्कुल अनोखा और हैरान करने वाला है।";
        textInput.focus();
    });

    presetHolistic.addEventListener('click', () => {
        textInput.value = "अब अकेले रहने की आदत हो गई है, पर कभी-कभी मन बहुत भारी और उदास हो जाता है।";
        textInput.focus();
    });

    // --- Form Submission / Analysis ---
    emotionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const text = textInput.value.trim();
        if (!text) return;

        // UI Updates
        resultContainer.classList.add('hidden');
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            
            if (response.ok) {
                // 1. Update Result Badge
                emotionBadge.textContent = data.emotion;
                emotionBadge.className = 'emotion-badge'; // Reset classes
                emotionBadge.classList.add(`badge-${data.emotion.toLowerCase()}`);
                
                // 2. Display Analyzed Text
                analyzedText.textContent = `"${data.text}"`;
                
                // 3. Render Custom Probability Bars
                renderConfidenceBars(data.probabilities);
                lastProbabilities = data.probabilities;

                // 4. Update Matplotlib Chart Image (bypass cache)
                emotionGraph.src = data.graph_url + "?t=" + new Date().getTime();
                
                noResultsPlaceholder.classList.add('hidden');
                resultContainer.classList.remove('hidden');
                
                // Move user to results tab immediately
                showResultsTab();
                
                // Reset input field
                textInput.value = '';
                
                if (historySection.classList.contains('active')) {
                    await fetchHistory();
                }
            } else {
                alert(data.error || 'An error occurred during prediction.');
            }
        } catch (error) {
            console.error('Error during prediction:', error);
            alert('Failed to connect to the server.');
        }
    });

    // Render detailed HTML confidence progress bars (sorted highest probability first)
    function renderConfidenceBars(probabilities) {
        barsList.innerHTML = '';
        
        // Convert to sorted array
        const sortedEmotions = Object.entries(probabilities)
            .map(([name, prob]) => ({ name, prob }))
            .sort((a, b) => b.prob - a.prob);
            
        sortedEmotions.forEach(item => {
            const pct = (item.prob * 100).toFixed(1);
            const row = document.createElement('div');
            row.className = 'progress-bar-row';
            
            row.innerHTML = `
                <div class="progress-bar-labels">
                    <span class="label-name">${item.name}</span>
                    <span class="label-pct">${pct}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 0%; background-color: var(--color-${item.name.toLowerCase()});"></div>
                </div>
            `;
            
            barsList.appendChild(row);
            
            // Trigger animation on next frame to display progress smoothly
            requestAnimationFrame(() => {
                row.querySelector('.progress-fill').style.width = `${pct}%`;
            });
        });
    }

    // --- Fetch History Logs ---
    async function fetchHistory() {
        try {
            const response = await fetch('/history');
            const data = await response.json();
            
            cachedHistory = Array.isArray(data.history) ? data.history : [];
            renderHistoryItems(cachedHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
            noHistory.innerHTML = '<p>Unable to load history logs.</p>';
            noHistory.classList.remove('hidden');
        }
    }

    // Render history card list
    function renderHistoryItems(items) {
        historyList.innerHTML = '';
        
        if (items.length > 0) {
            noHistory.classList.add('hidden');
            
            items.forEach(item => {
                const historyCard = document.createElement('div');
                historyCard.className = 'history-item';
                
                // Get highest probability emotion if available, else fallback to standard label
                const activeEmotion = item.emotion.toLowerCase();
                
                historyCard.innerHTML = `
                    <div class="history-meta-row">
                        <span class="emotion-badge badge-${activeEmotion}">${item.emotion}</span>
                        <span class="history-timestamp">${item.timestamp || 'Unknown time'}</span>
                    </div>
                    <p class="history-text">"${item.text}"</p>
                    <img class="history-graph" src="${item.graph_url}?t=${new Date().getTime()}" alt="Graph visual representation">
                `;
                
                const historyImg = historyCard.querySelector('.history-graph');
                historyImg.addEventListener('click', () => {
                    openInteractiveModal(item.probabilities, `History: "${item.text}"`);
                });
                
                historyList.appendChild(historyCard);
            });
        } else {
            noHistory.classList.remove('hidden');
        }
    }

    // Search and filter history events
    function applyHistoryFilter() {
        const query = historySearch.value.trim().toLowerCase();
        const selectedEmotion = historyEmotionFilter ? historyEmotionFilter.value.toLowerCase() : 'all';
        
        if (!query && selectedEmotion === 'all') {
            renderHistoryItems(cachedHistory);
            return;
        }

        const filtered = cachedHistory.filter(item => {
            const text = item.text.toLowerCase();
            const emotion = item.emotion.toLowerCase();
            const timestamp = (item.timestamp || '').toLowerCase();
            const matchesSearch = !query || text.includes(query) || emotion.includes(query) || timestamp.includes(query);
            const matchesEmotion = selectedEmotion === 'all' || emotion === selectedEmotion;
            return matchesSearch && matchesEmotion;
        });

        renderHistoryItems(filtered);
    }

    if (historySearch) {
        historySearch.addEventListener('input', applyHistoryFilter);
    }

    if (historyEmotionFilter) {
        historyEmotionFilter.addEventListener('change', applyHistoryFilter);
    }

    // --- Clear History ---
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
            if (!confirm("Are you sure you want to clear your analysis logs history?")) return;
            try {
                const response = await fetch('/clear_history', { method: 'POST' });
                if (response.ok) {
                    historyList.innerHTML = '';
                    cachedHistory = [];
                    noHistory.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error clearing history:', error);
                alert('Could not clear history logs from the server.');
            }
        });
    }

    // --- Interactive Chart Modal ---
    function openInteractiveModal(probabilities, titleText) {
        if (!probabilities) return;
        
        // Show modal overlay
        chartModal.classList.remove('hidden');
        
        // Set modal title
        const modalTitle = chartModal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = titleText || "Interactive Emotion Distribution";
        }
        
        // Prepare chart data
        const sortedData = Object.entries(probabilities)
            .map(([name, val]) => ({ name, val }))
            .sort((a, b) => b.val - a.val);
            
        const labels = sortedData.map(item => item.name.charAt(0).toUpperCase() + item.name.slice(1));
        const dataValues = sortedData.map(item => item.val * 100);
        
        // Theme color mappings
        const colorMap = {
            'anger': 'rgba(239, 68, 68, 0.85)',
            'happy': 'rgba(6, 182, 212, 0.85)',
            'sad': 'rgba(107, 114, 128, 0.85)',
            'surprise': 'rgba(234, 179, 8, 0.85)',
            'neutral': 'rgba(156, 163, 175, 0.85)'
        };
        
        const borderMap = {
            'anger': 'rgba(239, 68, 68, 1)',
            'happy': 'rgba(6, 182, 212, 1)',
            'sad': 'rgba(107, 114, 128, 1)',
            'surprise': 'rgba(234, 179, 8, 1)',
            'neutral': 'rgba(156, 163, 175, 1)'
        };
        
        const backgroundColors = sortedData.map(item => colorMap[item.name.toLowerCase()] || 'rgba(156, 163, 175, 0.85)');
        const borderColors = sortedData.map(item => borderMap[item.name.toLowerCase()] || 'rgba(156, 163, 175, 1)');
        
        // Destroy existing chart if it exists to avoid overlapping renders
        if (interactiveChartInstance) {
            interactiveChartInstance.destroy();
        }
        
        // Initialize Chart.js
        const ctx = interactiveCanvas.getContext('2d');
        interactiveChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Confidence (%)',
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1.5,
                    borderRadius: 0,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Confidence: ${context.parsed.y.toFixed(1)}%`;
                            }
                        },
                        padding: 10,
                        bodyFont: {
                            family: "'Outfit', sans-serif",
                            size: 13
                        },
                        titleFont: {
                            family: "'Outfit', sans-serif",
                            size: 13,
                            weight: 'bold'
                        },
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#71717a',
                            font: {
                                family: "'Outfit', sans-serif",
                                size: 13,
                                weight: '500'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#e4e4e7'
                        },
                        border: {
                            dash: [4, 4]
                        },
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#a1a1aa',
                            font: {
                                family: "'Outfit', sans-serif",
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    function closeModal() {
        chartModal.classList.add('hidden');
        if (interactiveChartInstance) {
            interactiveChartInstance.destroy();
            interactiveChartInstance = null;
        }
    }

    // Graph click listeners
    if (emotionGraph) {
        emotionGraph.addEventListener('click', () => {
            if (lastProbabilities) {
                const textSnippet = analyzedText.textContent.length > 30 
                    ? analyzedText.textContent.substring(0, 30) + '...' 
                    : analyzedText.textContent;
                openInteractiveModal(lastProbabilities, `Result: ${textSnippet}`);
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Close on click outside card
    if (chartModal) {
        chartModal.addEventListener('click', (e) => {
            if (e.target === chartModal) {
                closeModal();
            }
        });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chartModal && !chartModal.classList.contains('hidden')) {
            closeModal();
        }
    });
});
