document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const themeToggle = document.getElementById('themeToggle');
    const startTestBtn = document.getElementById('startTest');
    const submitTestBtn = document.getElementById('submitTest');
    const restartTestBtn = document.getElementById('restartTest');
    const newTestBtn = document.getElementById('newTest');
    const showAnswersBtn = document.getElementById('showAnswers');
    const questionsContainer = document.getElementById('questionsContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const testProgress = document.getElementById('testProgress');
    const testActions = document.getElementById('testActions');
    const progressFill = document.getElementById('progressFill');
    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const statsText = document.getElementById('statsText');
    
    // عناصر النتائج
    const finalScoreEl = document.getElementById('finalScore');
    const percentageEl = document.getElementById('percentage');
    const correctCountEl = document.getElementById('correctCount');
    const wrongCountEl = document.getElementById('wrongCount');
    const skippedCountEl = document.getElementById('skippedCount');
    const resultMessageEl = document.getElementById('resultMessage');
    
    // متغيرات التطبيق
    let currentTest = [];
    let userAnswers = {};
    let testStarted = false;
    let testCompleted = false;
    let testHistory = [];
    
    // عدد الأسئلة في كل اختبار
    const QUESTIONS_PER_TEST = 50;
    
    // تحديث الإحصائيات
    function updateStats() {
        const totalTests = testHistory.length;
        const avgScore = totalTests > 0 ? 
            Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / totalTests) : 0;
        
        statsText.textContent = totalTests > 0 ? 
            `أجريت ${totalTests} اختبارات بمعدل ${avgScore}/50` : 
            "لم تبدأ أي اختبار بعد";
    }
    
    // تبديل الوضع الليلي/النهاري
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
            
            if (document.body.classList.contains('dark-mode')) {
                this.innerHTML = '<i class="fas fa-sun"></i> الوضع النهاري';
            } else {
                this.innerHTML = '<i class="fas fa-moon"></i> الوضع الليلي';
            }
        });
    }
    
    // بدء اختبار جديد
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startNewTest);
    }
    
    if (newTestBtn) {
        newTestBtn.addEventListener('click', startNewTest);
    }
    
    function startNewTest() {
        // إعادة تعيين المتغيرات
        currentTest = [];
        userAnswers = {};
        testStarted = true;
        testCompleted = false;
        
        // إخفاء النتائج وإظهار الأسئلة
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (questionsContainer) {
            questionsContainer.innerHTML = '';
            questionsContainer.style.display = 'block';
        }
        
        // إظهار عناصر التحكم
        if (testProgress) testProgress.style.display = 'block';
        if (testActions) testActions.style.display = 'flex';
        
        // تعطيل زر البدء مؤقتاً
        if (startTestBtn) {
            startTestBtn.disabled = true;
            startTestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإعداد...';
        }
        
        // توليد 50 سؤالاً عشوائياً
        setTimeout(() => {
            if (!window.questionBank || window.questionBank.length === 0) {
                alert('خطأ: لم يتم تحميل الأسئلة. تأكد من وجود ملف questions.js');
                if (startTestBtn) {
                    startTestBtn.disabled = false;
                    startTestBtn.innerHTML = '<i class="fas fa-play"></i> بدء الاختبار الجديد';
                }
                return;
            }
            
            // نسخ جميع الأسئلة
            let availableQuestions = [...window.questionBank];
            
            // خلط الأسئلة عشوائياً
            for (let i = availableQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
            }
            
            // اختيار أول 50 سؤال
            currentTest = availableQuestions.slice(0, QUESTIONS_PER_TEST);
            
            // عرض الأسئلة
            displayQuestions();
            
            // تحديث شريط التقدم
            updateProgress();
            
            // تمكين زر البدء مرة أخرى
            if (startTestBtn) {
                startTestBtn.disabled = false;
                startTestBtn.innerHTML = '<i class="fas fa-play"></i> بدء الاختبار الجديد';
            }
            
            // تحديث الإحصائيات
            if (statsText) {
                statsText.textContent = `اختبار جاري: ${currentTest.length} سؤال`;
            }
        }, 500);
    }
    
    // عرض الأسئلة
    function displayQuestions() {
        if (!questionsContainer) return;
        
        questionsContainer.innerHTML = '';
        
        currentTest.forEach((question, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.dataset.questionId = question.id;
            
            let optionsHTML = '';
            
            if (question.type === 'true-false') {
                const isTrueSelected = userAnswers[question.id] === true;
                const isFalseSelected = userAnswers[question.id] === false;
                
                optionsHTML = `
                    <div class="true-false-buttons">
                        <button type="button" class="true-btn ${isTrueSelected ? 'selected' : ''}" 
                                data-question-id="${question.id}" data-answer="true">
                            <i class="fas fa-check"></i> صح
                        </button>
                        <button type="button" class="false-btn ${isFalseSelected ? 'selected' : ''}" 
                                data-question-id="${question.id}" data-answer="false">
                            <i class="fas fa-times"></i> خطأ
                        </button>
                    </div>
                `;
            } else if (question.type === 'multiple-choice') {
                optionsHTML = '<div class="options">';
                if (question.options && question.options.length > 0) {
                    question.options.forEach((option, optionIndex) => {
                        const isSelected = userAnswers[question.id] === optionIndex;
                        optionsHTML += `
                            <div class="option-item ${isSelected ? 'selected' : ''}" 
                                 data-question-id="${question.id}" data-option-index="${optionIndex}">
                                ${String.fromCharCode(65 + optionIndex)}) ${option}
                            </div>
                        `;
                    });
                } else {
                    optionsHTML += '<div class="error">لا توجد خيارات لهذا السؤال</div>';
                }
                optionsHTML += '</div>';
            }
            
            questionCard.innerHTML = `
                <div class="question-number">${index + 1}</div>
                <div class="question-text">${question.question || 'سؤال بدون نص'}</div>
                <div class="question-category">الفئة: ${question.category || 'عام'}</div>
                ${optionsHTML}
            `;
            
            questionsContainer.appendChild(questionCard);
        });
        
        // إضافة معالجات الأحداث للخيارات
        addEventListenersToOptions();
    }
    
    // إضافة معالجات الأحداث للخيارات
    function addEventListenersToOptions() {
        // معالجة أسئلة الصح/الخطأ
        document.querySelectorAll('.true-btn, .false-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!testStarted || testCompleted) return;
                
                const questionId = parseInt(this.dataset.questionId);
                const answer = this.dataset.answer === 'true';
                
                userAnswers[questionId] = answer;
                
                // تحديث واجهة المستخدم
                const questionCard = this.closest('.question-card');
                const trueBtn = questionCard.querySelector('.true-btn');
                const falseBtn = questionCard.querySelector('.false-btn');
                
                trueBtn.classList.remove('selected');
                falseBtn.classList.remove('selected');
                
                if (answer === true) {
                    trueBtn.classList.add('selected');
                } else {
                    falseBtn.classList.add('selected');
                }
                
                updateProgress();
            });
        });
        
        // معالجة الأسئلة متعددة الخيارات
        document.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', function() {
                if (!testStarted || testCompleted) return;
                
                const questionId = parseInt(this.dataset.questionId);
                const optionIndex = parseInt(this.dataset.optionIndex);
                
                userAnswers[questionId] = optionIndex;
                
                // تحديث واجهة المستخدم
                const questionCard = this.closest('.question-card');
                const optionItems = questionCard.querySelectorAll('.option-item');
                
                optionItems.forEach(item => item.classList.remove('selected'));
                this.classList.add('selected');
                
                updateProgress();
            });
        });
    }
    
    // تحديث شريط التقدم
    function updateProgress() {
        if (!progressFill || !currentQuestionEl) return;
        
        const answeredCount = Object.keys(userAnswers).length;
        const progress = (answeredCount / QUESTIONS_PER_TEST) * 100;
        
        progressFill.style.width = `${progress}%`;
        currentQuestionEl.textContent = answeredCount;
        if (totalQuestionsEl) totalQuestionsEl.textContent = QUESTIONS_PER_TEST;
    }
    
    // تقديم الاختبار وعرض النتيجة
    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', submitTest);
    }
    
    function submitTest() {
        if (!testStarted) return;
        
        testCompleted = true;
        testStarted = false;
        
        // حساب النتيجة
        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        
        currentTest.forEach(question => {
            const userAnswer = userAnswers[question.id];
            
            if (userAnswer === undefined) {
                skippedCount++;
            } else if (question.type === 'true-false') {
                if (userAnswer === question.correctAnswer) {
                    score++;
                    correctCount++;
                } else {
                    wrongCount++;
                }
            } else if (question.type === 'multiple-choice') {
                if (userAnswer === question.correctAnswer) {
                    score++;
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        });
        
        // حفظ النتيجة في السجل
        testHistory.push({
            date: new Date().toLocaleString('ar-YE'),
            score: score,
            total: QUESTIONS_PER_TEST,
            correctCount: correctCount,
            wrongCount: wrongCount,
            skippedCount: skippedCount
        });
        
        // تحديث واجهة النتائج
        if (finalScoreEl) finalScoreEl.textContent = score;
        const percentage = Math.round((score / QUESTIONS_PER_TEST) * 100);
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
        
        if (correctCountEl) correctCountEl.textContent = correctCount;
        if (wrongCountEl) wrongCountEl.textContent = wrongCount;
        if (skippedCountEl) skippedCountEl.textContent = skippedCount;
        
        // عرض رسالة حسب النتيجة
        let message = '';
        if (percentage >= 90) {
            message = 'ممتاز! أداء رائع. أنت على مستوى عالٍ من المعرفة.';
        } else if (percentage >= 75) {
            message = 'جيد جداً! لديك فهم قوي للمادة.';
        } else if (percentage >= 60) {
            message = 'جيد! تحتاج إلى بعض التحسين في بعض المجالات.';
        } else if (percentage >= 50) {
            message = 'مقبول! تحتاج إلى مراجعة المادة بشكل أفضل.';
        } else {
            message = 'ضعيف! أنت بحاجة إلى دراسة أكثر وتكرار الاختبار.';
        }
        
        if (resultMessageEl) resultMessageEl.textContent = message;
        
        // إظهار النتائج وإخفاء الأسئلة
        if (questionsContainer) questionsContainer.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';
        
        // إخفاء عناصر التحكم
        if (testProgress) testProgress.style.display = 'none';
        if (testActions) testActions.style.display = 'none';
        
        // تمكين زر البدء
        if (startTestBtn) startTestBtn.disabled = false;
        
        // تحديث الإحصائيات
        updateStats();
    }
    
    // إعادة الاختبار
    if (restartTestBtn) {
        restartTestBtn.addEventListener('click', function() {
            if (confirm('هل تريد بالتأكيد إعادة الاختبار؟ سيتم مسح جميع إجاباتك الحالية.')) {
                userAnswers = {};
                testCompleted = false;
                testStarted = true;
                
                // إعادة تعيين واجهة المستخدم
                displayQuestions();
                updateProgress();
                
                // إخفاء النتائج
                if (resultsContainer) resultsContainer.style.display = 'none';
                if (questionsContainer) questionsContainer.style.display = 'block';
                
                // إظهار عناصر التحكم
                if (testProgress) testProgress.style.display = 'block';
                if (testActions) testActions.style.display = 'flex';
            }
        });
    }
    
    // عرض الإجابات
    if (showAnswersBtn) {
        showAnswersBtn.addEventListener('click', function() {
            if (!questionsContainer || !resultsContainer) return;
            
            questionsContainer.style.display = 'block';
            resultsContainer.style.display = 'none';
            
            // إضافة الإجابات الصحيحة إلى كل سؤال
            currentTest.forEach((question) => {
                const questionCard = document.querySelector(`[data-question-id="${question.id}"]`);
                if (!questionCard) return;
                
                const questionText = questionCard.querySelector('.question-text');
                if (!questionText) return;
                
                let correctAnswerText = '';
                if (question.type === 'true-false') {
                    correctAnswerText = question.correctAnswer ? 'صح' : 'خطأ';
                } else if (question.type === 'multiple-choice') {
                    if (question.options && question.options[question.correctAnswer]) {
                        const correctOption = question.options[question.correctAnswer];
                        correctAnswerText = `${String.fromCharCode(65 + question.correctAnswer)}) ${correctOption}`;
                    } else {
                        correctAnswerText = 'إجابة غير متوفرة';
                    }
                }
                
                // التحقق من إجابة المستخدم
                const userAnswer = userAnswers[question.id];
                let userAnswerText = '';
                let answerClass = '';
                
                if (userAnswer !== undefined) {
                    if (question.type === 'true-false') {
                        userAnswerText = userAnswer ? 'صح' : 'خطأ';
                    } else if (question.type === 'multiple-choice') {
                        if (question.options && question.options[userAnswer]) {
                            userAnswerText = `${String.fromCharCode(65 + userAnswer)}) ${question.options[userAnswer]}`;
                        } else {
                            userAnswerText = 'إجابة غير صالحة';
                        }
                    }
                    
                    // تحديد إذا كانت الإجابة صحيحة
                    const isCorrect = question.type === 'true-false' ? 
                        userAnswer === question.correctAnswer : 
                        userAnswer === question.correctAnswer;
                    
                    answerClass = isCorrect ? 'correct-answer' : 'wrong-answer';
                } else {
                    userAnswerText = 'لم تجب على هذا السؤال';
                    answerClass = 'skipped-answer';
                }
                
                // إضافة قسم الإجابات
                const answerDiv = document.createElement('div');
                answerDiv.className = `answer-feedback ${answerClass}`;
                answerDiv.innerHTML = `
                    <div class="answer-row">
                        <strong>إجابتك:</strong> ${userAnswerText}
                    </div>
                    <div class="answer-row">
                        <strong>الإجابة الصحيحة:</strong> ${correctAnswerText}
                    </div>
                    ${question.explanation ? `<div class="explanation"><strong>شرح:</strong> ${question.explanation}</div>` : ''}
                `;
                
                // إدراج قسم الإجابات بعد نص السؤال
                questionText.parentNode.insertBefore(answerDiv, questionText.nextSibling);
            });
            
            // إضافة زر للعودة إلى النتائج
            const backButton = document.createElement('button');
            backButton.className = 'btn btn-primary';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> العودة إلى النتائج';
            backButton.style.margin = '20px auto';
            backButton.style.display = 'block';
            backButton.onclick = function() {
                if (questionsContainer) questionsContainer.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';
            };
            
            questionsContainer.appendChild(backButton);
        });
    }
    
    // التهيئة الأولية
    updateStats();
    
    // إضافة أنماط CSS للإجابات إذا لم تكن موجودة
    if (!document.querySelector('#answer-styles')) {
        const style = document.createElement('style');
        style.id = 'answer-styles';
        style.textContent = `
            .answer-feedback {
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                border-right: 4px solid;
            }
            
            .correct-answer {
                background-color: #d4edda;
                border-color: #28a745;
            }
            
            .wrong-answer {
                background-color: #f8d7da;
                border-color: #dc3545;
            }
            
            .skipped-answer {
                background-color: #fff3cd;
                border-color: #ffc107;
            }
            
            .answer-row {
                margin-bottom: 8px;
            }
            
            .answer-row:last-child {
                margin-bottom: 0;
            }
            
            .explanation {
           