document.addEventListener('DOMContentLoaded', function() {
    let categories, configurations, products, subtypes, symptoms, questions, answers, failures;
    let currentStep = 0;
    let selectedCategory = null;
    let selectedProduct = null;
    let selectedSubtype = null;
    let selectedConfig = null;
    let selectedSymptoms = [];
    let selectedAnswers = [];
    let finalFailure = null;

    async function fetchData() {
        categories = await fetch('Categorías.json').then(response => response.json());
        configurations = await fetch('Configuración.json').then(response => response.json());
        products = await fetch('tipoProducto.json').then(response => response.json());
        subtypes = await fetch('Subtipo.json').then(response => response.json());
        symptoms = await fetch('Síntoma.json').then(response => response.json());
        questions = await fetch('pregunta.json').then(response => response.json());
        answers = await fetch('respuesta.json').then(response => response.json());
        failures = await fetch('falla.json').then(response => response.json());
    }

    async function startQuestionnaire() {
        await fetchData();
        currentStep = 1;
        selectedSymptoms = [];
        selectedAnswers = [];
        finalFailure = null;
        document.getElementById('save-pdf-button').style.display = 'none';
        showCategories();
    }

    function showCategories() {
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = '<h2>Seleccione una categoría</h2>';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category.nombre;
            button.onclick = () => selectCategory(category);
            section.appendChild(button);
        });
    }

    function selectCategory(category) {
        selectedCategory = category;
        showProducts();
    }

    function showProducts() {
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = '<h2>Seleccione un tipo de producto</h2>';
        products.filter(product => product.categoriaID === selectedCategory.categoriaID).forEach(product => {
            const button = document.createElement('button');
            button.textContent = product.nombre;
            button.onclick = () => selectProduct(product);
            section.appendChild(button);
        });
    }

    function selectProduct(product) {
        selectedProduct = product;
        showSubtypes();
    }

    function showSubtypes() {
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = '<h2>Seleccione un subtipo</h2>';
        subtypes.filter(subtype => subtype.tipoProductoID === selectedProduct.tipoProductoID).forEach(subtype => {
            const button = document.createElement('button');
            button.textContent = subtype.nombre;
            button.onclick = () => selectSubtype(subtype);
            section.appendChild(button);
        });
    }

    function selectSubtype(subtype) {
        selectedSubtype = subtype;
        const hasConfig = configurations.some(config => config.subtipoID === subtype.subtipoID);
        if (hasConfig) {
            showConfigurations();
        } else {
            selectedConfig = null;
            showSymptoms();
        }
    }

    function showConfigurations() {
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = '<h2>Seleccione una configuración</h2>';
        configurations.filter(config => config.subtipoID === selectedSubtype.subtipoID).forEach(config => {
            const button = document.createElement('button');
            button.textContent = config.nombre;
            button.onclick = () => selectConfig(config);
            section.appendChild(button);
        });
    }

    function selectConfig(config) {
        selectedConfig = config;
        showSymptoms();
    }

    function showSymptoms() {
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = '<h2>Seleccione un síntoma</h2>';
        let relevantSymptoms = symptoms.filter(symptom => symptom.subtipoID === selectedSubtype.subtipoID);
        if (selectedConfig !== null) {
            relevantSymptoms = relevantSymptoms.filter(symptom => symptom.configuracionID === selectedConfig.configuracionID);
        } else {
            relevantSymptoms = relevantSymptoms.filter(symptom => symptom.configuracionID === null);
        }
        relevantSymptoms.forEach(symptom => {
            const button = document.createElement('button');
            button.textContent = symptom.nombre;
            button.onclick = () => selectSymptom(symptom);
            section.appendChild(button);
        });
    }

    function selectSymptom(symptom) {
        selectedSymptoms.push(symptom);
        const nextQuestion = questions.find(question => question.sintomaID === symptom.sintomaID);
        if (nextQuestion) {
            showQuestion(nextQuestion);
        } else {
            showDiagnosis();
        }
    }

    function showQuestion(question) {
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = `<h2>${question.texto}</h2>`;
        answers.filter(answer => answer.preguntaID === question.preguntaID).forEach(answer => {
            const button = document.createElement('button');
            button.textContent = answer.texto;
            button.onclick = () => selectAnswer(answer, question.texto);
            section.appendChild(button);
        });
    }

    function selectAnswer(answer, questionText) {
        selectedAnswers.push({ question: questionText, answer: answer.texto });
        if (answer.siguientePreguntaID) {
            const nextQuestion = questions.find(question => question.preguntaID === answer.siguientePreguntaID);
            showQuestion(nextQuestion);
        } else if (answer.fallaID) {
            showDiagnosis(answer.fallaID);
        }
    }

    function showDiagnosis(failureID) {
        finalFailure = failures.find(f => f.fallaID === failureID);
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = `
            <div id="diagnosis">
                <h3 class="failure">Falla: ${finalFailure.nombre}</h3>
                <div class="recommendation">
                    <h3>Recomendación:</h3>
                    <p>${finalFailure.diagnostico}</p>
                </div>
                <div class="technical-info">
                    <h3>Información para Técnico:</h3>
                    <p><strong>Repuestos:</strong> ${finalFailure.repuestos}</p>
                    <p><strong>Herramientas:</strong> ${finalFailure.herramientas}</p>
                </div>
            </div>
        `;
        document.getElementById('save-pdf-button').style.display = 'block';
    }

    async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let y = 10;
        doc.setFontSize(16);
        doc.text("Cuestionario de Falla", 10, y);
        y += 10;

        doc.setFontSize(14);
        doc.text("Selección de Categoría a Síntoma:", 10, y);
        y += 10;

        doc.setFontSize(12);
        doc.text(`Categoría: ${selectedCategory.nombre}`, 10, y);
        y += 7;
        doc.text(`Tipo de Producto: ${selectedProduct.nombre}`, 10, y);
        y += 7;
        doc.text(`Subtipo: ${selectedSubtype.nombre}`, 10, y);
        y += 7;
        if (selectedConfig) {
            doc.text(`Configuración: ${selectedConfig.nombre}`, 10, y);
            y += 7;
        }
        selectedSymptoms.forEach((symptom, index) => {
            doc.text(`Síntoma ${index + 1}: ${symptom.nombre}`, 10, y);
            y += 7;
        });

        y += 10;
        doc.setFontSize(14);
        doc.text("Respuestas Seleccionadas:", 10, y);
        y += 10;

        doc.setFontSize(12);
        selectedAnswers.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.question}`, 10, y);
            y += 7;
            doc.text(`Respuesta: ${item.answer}`, 10, y);
            y += 10;
        });

        y += 10;
        doc.setFontSize(14);
        doc.text("Diagnóstico:", 10, y);
        y += 10;

        doc.setFontSize(12);
        if (finalFailure) {
            doc.text(`Falla: ${finalFailure.nombre}`, 10, y);
            y += 7;
            doc.text(`Recomendación: ${finalFailure.diagnostico}`, 10, y);
            y += 7;
            doc.text(`Repuestos: ${finalFailure.repuestos}`, 10, y);
            y += 7;
            doc.text(`Herramientas: ${finalFailure.herramientas}`, 10, y);
            y += 7;
        }

        doc.save('cuestionario_de_falla.pdf');
    }

    window.startQuestionnaire = startQuestionnaire;
    window.generatePDF = generatePDF;
});
