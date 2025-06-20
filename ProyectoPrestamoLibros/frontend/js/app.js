document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('prestamo-form');
  const prestamosBody = document.getElementById('prestamos-body');
  const filterStatus = document.getElementById('filter-status');
  const formTitle = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  let editingId = null;
  let prestamos = [];

  loadPrestamos();

  filterStatus.addEventListener('change', function () {
    loadPrestamos();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      alert('Por favor complete todos los campos requeridos correctamente');
      return;
    }

    const prestamoData = {
      titulo: document.getElementById('titulo').value,
      autor: document.getElementById('autor').value,
      amigo: document.getElementById('amigo').value,
      fechaPrestamo: document.getElementById('fechaPrestamo').value,
      fechaLimite: document.getElementById('fechaLimite').value || null,
      estado: 'Prestado'
    };

    try {
      if (editingId) {
        await updatePrestamo(editingId, prestamoData);
      } else {
        await createPrestamo(prestamoData);
      }
    } catch (error) {
      console.error('Error en el formulario:', error);
      alert('Error al guardar: ' + error.message);
    }
  });

  cancelBtn.addEventListener('click', function () {
    resetForm();
  });

  function validateForm() {
    let isValid = true;

    const requiredFields = ['titulo', 'autor', 'amigo', 'fechaPrestamo'];
    requiredFields.forEach(field => {
      const element = document.getElementById(field);
      const errorElement = document.getElementById(`${field}-error`);

      if (!element.value.trim()) {
        errorElement.textContent = 'Este campo es obligatorio';
        isValid = false;
      } else {
        errorElement.textContent = '';
      }
    });

    const fechaPrestamo = new Date(document.getElementById('fechaPrestamo').value);
    const fechaLimite = document.getElementById('fechaLimite').value
      ? new Date(document.getElementById('fechaLimite').value)
      : null;

    if (fechaLimite && fechaLimite < fechaPrestamo) {
      document.getElementById('fechaLimite-error').textContent =
        'La fecha límite no puede ser anterior a la fecha de préstamo';
      isValid = false;
    } else {
      document.getElementById('fechaLimite-error').textContent = '';
    }

    return isValid;
  }

  function loadPrestamos() {
    const status = filterStatus.value;
    let url = 'http://localhost:3000/api/prestamos';

    if (status !== 'all') {
      url += `?estado=${status}`;
    }

    function loadPrestamos() {
  const status = filterStatus.value;
  let url = 'http://localhost:3000/api/prestamos';

  if (status !== 'all') {
    url += `?estado=${status}`;
  }

  fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status === 401) {
      throw new Error('No autorizado: Verifica tu conexión');
    }
    if (!response.ok) throw new Error('Error al cargar préstamos');
    return response.json();
  })
  // ... resto del código
}
  }

  function renderPrestamos() {
    prestamosBody.innerHTML = '';

    if (prestamos.length === 0) {
      prestamosBody.innerHTML = '<tr><td colspan="7">No hay préstamos registrados</td></tr>';
      return;
    }

    prestamos.forEach(prestamo => {
      const row = document.createElement('tr');

      const fechaPrestamo = new Date(prestamo.fechaPrestamo).toLocaleDateString();
      const fechaLimite = prestamo.fechaLimite
        ? new Date(prestamo.fechaLimite).toLocaleDateString()
        : 'No especificada';
      const fechaDevolucion = prestamo.fechaDevolucion
        ? new Date(prestamo.fechaDevolucion).toLocaleDateString()
        : 'No devuelto';

      row.innerHTML = `
        <td>${prestamo.titulo}</td>
        <td>${prestamo.autor}</td>
        <td>${prestamo.amigo}</td>
        <td>${fechaPrestamo}</td>
        <td>${fechaLimite}</td>
        <td class="status-${prestamo.estado.toLowerCase()}">${prestamo.estado}</td>
        <td>
          ${prestamo.estado === 'Prestado'
          ? `<button class="action-btn return-btn" data-id="${prestamo._id}">Marcar Devuelto</button>`
          : ''}
          <button class="action-btn edit-btn" data-id="${prestamo._id}">Editar</button>
          <button class="action-btn delete-btn" data-id="${prestamo._id}">Eliminar</button>
        </td>
      `;

      prestamosBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        editPrestamo(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        deletePrestamo(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.return-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        markAsReturned(this.getAttribute('data-id'));
      });
    });
  }

  function createPrestamo(prestamoData) {
    return fetch('http://localhost:3000/api/prestamos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prestamoData)
    })
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
      })
      .then(data => {
        alert('Préstamo creado exitosamente!');
        loadPrestamos();
        resetForm();
        return data;
      });
  }

  function editPrestamo(id) {
    const prestamo = prestamos.find(p => p._id === id);
    if (!prestamo) return;

    editingId = id;
    formTitle.textContent = 'Editar Préstamo';
    submitBtn.textContent = 'Actualizar';
    cancelBtn.style.display = 'inline-block';

    document.getElementById('titulo').value = prestamo.titulo;
    document.getElementById('autor').value = prestamo.autor;
    document.getElementById('amigo').value = prestamo.amigo;
    document.getElementById('fechaPrestamo').value = prestamo.fechaPrestamo.split('T')[0];
    document.getElementById('fechaLimite').value = prestamo.fechaLimite ? prestamo.fechaLimite.split('T')[0] : '';
  }

  function updatePrestamo(id, prestamoData) {
    return fetch(`http://localhost:3000/api/prestamos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prestamoData)
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar');
        return response.json();
      })
      .then(data => {
        alert('Préstamo actualizado exitosamente!');
        loadPrestamos();
        resetForm();
        return data;
      });
  }

  function markAsReturned(id) {
    if (!confirm('¿Marcar este préstamo como devuelto?')) return;

    fetch(`http://localhost:3000/api/prestamos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado: 'Devuelto', fechaDevolucion: new Date().toISOString() })
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al marcar como devuelto');
        return response.json();
      })
      .then(data => {
        alert('Préstamo marcado como devuelto!');
        loadPrestamos();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      });
  }

  function deletePrestamo(id) {
    if (!confirm('¿Estás seguro de eliminar este préstamo?')) return;

    fetch(`http://localhost:3000/api/prestamos/${id}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al eliminar');
        return response.json();
      })
      .then(data => {
        alert('Préstamo eliminado exitosamente!');
        loadPrestamos();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      });
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = 'Agregar Nuevo Préstamo';
    submitBtn.textContent = 'Guardar';
    cancelBtn.style.display = 'none';

    document.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
    });
  }
});