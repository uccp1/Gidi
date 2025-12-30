// پلیس فتا - اسکریپت اصلی
document.addEventListener('DOMContentLoaded', function() {
    console.log('سایت پلیس فتا بارگذاری شد - نسخه 2.1.0');
    
    // متغیرهای سراسری
    const currentStep = {
        step: 1,
        maxSteps: 3,
        formData: {
            crimeType: '',
            details: '',
            url: '',
            files: [],
            contactInfo: ''
        }
    };

    // ===== سیستم مدیریت فرم چند مرحله‌ای =====
    window.nextStep = function() {
        if (!validateStep(currentStep.step)) return;
        
        if (currentStep.step < currentStep.maxSteps) {
            document.getElementById(`step${currentStep.step}`).classList.remove('active');
            currentStep.step++;
            document.getElementById(`step${currentStep.step}`).classList.add('active');
            updateFormProgress();
        }
    };

    window.prevStep = function() {
        if (currentStep.step > 1) {
            document.getElementById(`step${currentStep.step}`).classList.remove('active');
            currentStep.step--;
            document.getElementById(`step${currentStep.step}`).classList.add('active');
            updateFormProgress();
        }
    };

    function validateStep(step) {
        switch(step) {
            case 1:
                const selectedType = document.querySelector('input[name="crimeType"]:checked');
                if (!selectedType) {
                    showNotification('لطفاً نوع تخلف را انتخاب کنید', 'warning');
                    return false;
                }
                currentStep.formData.crimeType = selectedType.value;
                return true;
                
            case 2:
                const details = document.getElementById('crimeDetails').value.trim();
                if (details.length < 50) {
                    showNotification('لطفاً شرح کامل تخلف را وارد کنید (حداقل ۵۰ کاراکتر)', 'warning');
                    return false;
                }
                currentStep.formData.details = details;
                currentStep.formData.url = document.getElementById('crimeURL').value;
                return true;
                
            default:
                return true;
        }
    }

    function updateFormProgress() {
        const steps = document.querySelectorAll('.form-step');
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            if (stepNum < currentStep.step) {
                step.classList.add('completed');
            } else {
                step.classList.remove('completed');
            }
        });
    }

    // ===== سیستم آپلود فایل =====
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        Array.from(files).forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                showNotification(`نوع فایل ${file.name} پشتیبانی نمی‌شود`, 'error');
                return;
            }
            
            if (file.size > maxSize) {
                showNotification(`حجم فایل ${file.name} بیش از حد مجاز است`, 'error');
                return;
            }
            
            // اضافه کردن به لیست
            currentStep.formData.files.push(file);
            addFileToList(file);
        });
        
        // آپدیت اینپوت فایل برای امکان انتخاب مجدد
        fileInput.value = '';
    }

    function addFileToList(file) {
        const fileId = Date.now() + Math.random();
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.id = fileId;
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt file-icon"></i>
                <div>
                    <strong>${file.name}</strong>
                    <small>(${(file.size / 1024 / 1024).toFixed(2)} مگابایت)</small>
                </div>
            </div>
            <button class="remove-file" onclick="removeFile('${fileId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    }

    window.removeFile = function(fileId) {
        const fileItem = document.querySelector(`.file-item[data-id="${fileId}"]`);
        if (fileItem) {
            const fileName = fileItem.querySelector('strong').textContent;
            currentStep.formData.files = currentStep.formData.files.filter(f => f.name !== fileName);
            fileItem.remove();
        }
    };

    // ===== سیستم ارسال فرم =====
    const reportForm = document.getElementById('crimeReportForm');
    
    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // جمع‌آوری آخرین داده‌ها
        currentStep.formData.contactInfo = document.getElementById('contactInfo').value;
        
        // اعتبارسنجی نهایی
        if (currentStep.formData.files.length === 0) {
            const confirmUpload = confirm('آیا مطمئن هستید که می‌خواهید بدون ضمیمه فایل گزارش را ارسال کنید؟');
            if (!confirmUpload) return;
        }
        
        // نمایش انیمیشن ارسال
        const submitBtn = this.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
        submitBtn.disabled = true;
        
        try {
            // شبیه‌سازی ارسال به سرور
            await simulateServerSubmission(currentStep.formData);
            
            // نمایش موفقیت
            showNotification('گزارش شما با موفقیت ثبت شد. کد پیگیری: FATA-' + Date.now(), 'success');
            
            // ریست فرم
            resetForm();
            
            // بازگشت به مرحله اول
            document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
            document.getElementById('step1').classList.add('active');
            currentStep.step = 1;
            updateFormProgress();
            
        } catch (error) {
            showNotification('خطا در ارسال گزارش. لطفاً مجدداً تلاش کنید.', 'error');
            console.error('ارسال گزارش ناموفق:', error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    async function simulateServerSubmission(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // شبیه‌سازی تاخیر شبکه
                const shouldSucceed = Math.random() > 0.1; // 90% موفقیت
                
                if (shouldSucceed) {
                    // ذخیره در localStorage برای نمایش (در حالت واقعی به سرور ارسال می‌شود)
                    const reports = JSON.parse(localStorage.getItem('fata_reports') || '[]');
                    reports.push({
                        id: 'FATA-' + Date.now(),
                        data: data,
                        timestamp: new Date().toISOString(),
                        status: 'در انتظار بررسی'
                    });
                    localStorage.setItem('fata_reports', JSON.stringify(reports));
                    
                    resolve();
                } else {
                    reject(new Error('خطای سرور'));
                }
            }, 2000);
        });
    }

    function resetForm() {
        // ریست همه فیلدها
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        document.getElementById('crimeDetails').value = '';
        document.getElementById('crimeURL').value = '';
        document.getElementById('contactInfo').value = '';
        currentStep.formData.files = [];
        fileList.innerHTML = '';
        document.getElementById('charCount').textContent = '0';
    }

    // ===== سیستم شمارنده کاراکتر =====
    const crimeDetails = document.getElementById('crimeDetails');
    const charCount = document.getElementById('charCount');
    
    crimeDetails.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        
        if (length > 1000) {
            this.value = this.value.substring(0, 1000);
            charCount.textContent = 1000;
            showNotification('حداکثر تعداد کاراکتر ۱۰۰۰ می‌باشد', 'warning');
        }
    });

    // ===== سیستم تب‌ها =====
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // غیرفعال کردن همه تب‌ها
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // فعال کردن تب انتخاب شده
            this.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // ===== سیستم نوبار موبایل =====
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // ===== سیستم اسکرول نرم =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // بستن منوی موبایل در صورت باز بودن
                if (navMenu.style.display === 'flex') {
                    navMenu.style.display = 'none';
                }
                
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== دکمه بازگشت به بالا =====
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ===== سیستم نمایش آمار انیمیشنی =====
    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000; // 2 ثانیه
        const step = target / (duration / 16); // 60 فریم در ثانیه
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target.toLocaleString('fa-IR');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString('fa-IR');
            }
        }, 16);
    }

    function checkCounterVisibility() {
        const statsSection = document.querySelector('.stats-section');
        if (!statsSection) return;
        
        const sectionPosition = statsSection.getBoundingClientRect();
        const screenPosition = window.innerHeight / 1.3;
        
        if (sectionPosition.top < screenPosition) {
            document.querySelectorAll('.stat-number').forEach(counter => {
                if (!counter.classList.contains('animated')) {
                    counter.classList.add('animated');
                    animateCounter(counter);
                }
            });
        }
    }
    
    window.addEventListener('scroll', checkCounterVisibility);
    checkCounterVisibility(); // بررسی اولیه

    // ===== سیستم نکات امنیتی شناور =====
    const securityTips = [
        "رمز عبور خود را هر ۳ ماه تغییر دهید",
        "از یک رمز عبور برای چند سایت استفاده نکنید",
        "احراز هویت دو مرحله‌ای را فعال کنید",
        "لینک‌های ناشناس را کلیک نکنید",
        "برنامه‌های خود را به‌روز نگه دارید",
        "از وای‌فای عمومی برای تراکنش‌ها استفاده نکنید",
        "از آنتی‌ویروس معتبر استفاده کنید",
        "بکاپ‌گیری منظم را فراموش نکنید",
        "تنظیمات حریم خصوصی شبکه‌های اجتماعی را بررسی کنید",
        "ایمیل‌های مشکوک را باز نکنید"
    ];

    let currentTipIndex = 0;
    const tipElement = document.querySelector('.security-tip-floating');
    const tipText = document.getElementById('floating-tip-text');
    const closeTipBtn = document.querySelector('.close-tip');

    function showNextTip() {
        tipText.textContent = securityTips[currentTipIndex];
        currentTipIndex = (currentTipIndex + 1) % securityTips.length;
        
        // نمایش تیپ با انیمیشن
        tipElement.style.display = 'block';
        setTimeout(() => {
            tipElement.style.opacity = '1';
            tipElement.style.transform = 'translateX(0)';
        }, 100);
    }

    // بستن تیپ
    closeTipBtn.addEventListener('click', function() {
        tipElement.style.opacity = '0';
        tipElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            tipElement.style.display = 'none';
        }, 500);
    });

    // نمایش اولین تیپ بعد از ۵ ثانیه
    setTimeout(showNextTip, 5000);
    
    // تغییر تیپ هر ۲۰ ثانیه
    setInterval(showNextTip, 20000);

    // ===== سیستم جستجو =====
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }

    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            showNotification(`در حال جستجو برای: ${query}`, 'info');
            // در حالت واقعی به صفحه نتایج هدایت می‌شود
        }
    }

    // ===== سیستم نوتیفیکیشن =====
    function showNotification(message, type = 'info') {
        // حذف نوتیفیکیشن قبلی
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // ایجاد نوتیفیکیشن جدید
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // استایل‌های نوتیفیکیشن
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 20px;
            right: 20px;
            max-width: 400px;
            margin: 0 auto;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // بستن خودکار بعد از ۵ ثانیه
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // دکمه بستن
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    function getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    function getNotificationColor(type) {
        const colors = {
            'success': 'linear-gradient(135deg, #4CAF50, #2E7D32)',
            'error': 'linear-gradient(135deg, #F44336, #C62828)',
            'warning': 'linear-gradient(135deg, #FF9800, #EF6C00)',
            'info': 'linear-gradient(135deg, #2196F3, #1565C0)'
        };
        return colors[type] || colors.info;
    }

    // ===== سیستم آفلاین/آنلاین =====
    window.addEventListener('online', () => {
        showNotification('اتصال اینترنت برقرار شد', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('اتصال اینترنت قطع شده است', 'warning');
    });

    // ===== انیمیشن اسکرول =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // مشاهده تمام عناصری که نیاز به انیمیشن دارند
    document.querySelectorAll('.education-card, .alert-card, .info-card').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

    // ===== مدیریت خطاهای جاوااسکریپت =====
    window.addEventListener('error', function(e) {
        console.error('خطای جاوااسکریپت:', e.error);
        // در حالت واقعی می‌توان این خطاها را به سرور گزارش داد
    });

    // ===== تاریخ شمسی =====
    function getPersianDate() {
        const now = new Date();
        const persianDate = now.toLocaleDateString('fa-IR');
        return persianDate;
    }

    // نمایش تاریخ در فوتر
    const footerDate = document.querySelector('.footer-bottom p');
    if (footerDate) {
        const currentYear = new Date().getFullYear();
        const persianYear = currentYear - 621;
        footerDate.innerHTML = `© کلیه حقوق این وب‌سایت متعلق به پلیس فتا می‌باشد. ${persianYear}`;
    }

    console.log('پلیس فتا - سیستم آماده به کار');
});