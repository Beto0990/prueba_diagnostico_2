document.addEventListener('DOMContentLoaded', function() {
    let categories, configurations, products, subtypes, symptoms, questions, answers, failures;
    let currentStep = 0;
    let selectedCategory = null;
    let selectedProduct = null;
    let selectedSubtype = null;
    let selectedConfig = null;
    let selectedSymptoms = [];

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
            button.onclick = () => selectAnswer(answer);
            section.appendChild(button);
        });
    }

    function selectAnswer(answer) {
        if (answer.siguientePreguntaID) {
            const nextQuestion = questions.find(question => question.preguntaID === answer.siguientePreguntaID);
            showQuestion(nextQuestion);
        } else if (answer.fallaID) {
            showDiagnosis(answer.fallaID);
        }
    }

    function showDiagnosis(failureID) {
        const failure = failures.find(f => f.fallaID === failureID);
        const section = document.getElementById('questionnaire-section');
        section.innerHTML = `
            <h2>Diagnóstico</h2>
            <p>Falla: ${failure.nombre}</p>
            <p>Recomendación: ${failure.diagnostico}</p>
            <p>Repuestos: ${failure.repuestos}</p>
            <p>Herramientas: ${failure.herramientas}</p>
        `;
    }

    window.startQuestionnaire = startQuestionnaire;
});

