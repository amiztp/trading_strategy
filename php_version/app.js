/**
 * Strategy Builder Pro - Frontend Interactivity
 * Handles D3 chart rendering and client-side actions.
 */

document.addEventListener('DOMContentLoaded', () => {
    renderAccuracyChart();
});

function renderAccuracyChart() {
    const chartContainer = document.getElementById('accuracy-chart');
    if (!chartContainer) return;

    const accuracy = parseInt(chartContainer.getAttribute('data-accuracy')) || 0;
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select('#accuracy-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const data = [
        { label: 'Checked', value: accuracy },
        { label: 'Remaining', value: 100 - accuracy }
    ];

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(['#4f46e5', '#e2e8f0']);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.75)
        .outerRadius(radius)
        .cornerRadius(8);

    const path = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label))
        .attr('stroke', 'white')
        .style('stroke-width', '2px')
        .each(function(d) { this._current = d; });

    // Central Text
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .style('font-size', '32px')
        .style('font-weight', '800')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('fill', '#0f172a')
        .text(`${accuracy}%`);

    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.1em')
        .style('fill', '#94a3b8')
        .text('Accuracy');
}

// Client-side actions
function addStrategy() {
    const name = prompt('Enter strategy name:', 'New Strategy');
    if (name) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'api.php?action=add_strategy';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'name';
        input.value = name;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

function deleteStrategy(id) {
    if (confirm('Are you sure you want to delete this strategy?')) {
        window.location.href = `api.php?action=delete_strategy&id=${id}`;
    }
}

function duplicateStrategy(id) {
    window.location.href = `api.php?action=duplicate_strategy&id=${id}`;
}

function toggleRule(id) {
    window.location.href = `api.php?action=toggle_rule&id=${id}`;
}

function deleteRule(id) {
    if (confirm('Delete this rule?')) {
        window.location.href = `api.php?action=delete_rule&id=${id}`;
    }
}

function editStrategyName(id) {
    const currentName = document.getElementById('strategy-name').innerText;
    const newName = prompt('Edit strategy name:', currentName);
    if (newName && newName !== currentName) {
        // In a real app, you'd use fetch() here. 
        // For simplicity in this rewrite, we'll use a form or redirect.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `api.php?action=edit_strategy&id=${id}`;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'name';
        input.value = newName;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}
