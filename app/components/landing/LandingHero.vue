<template>
  <section class="hero-section py-5 py-lg-6">
    <div class="container">
      <div class="row align-items-center g-4">
        <div class="col-lg-6">
          <span class="badge text-bg-light border mb-3">
            <i class="fas fa-bolt text-warning me-1"></i>
            Facturación electrónica simple y profesional
          </span>

          <h1 class="display-5 fw-bold mb-3">
            Emite facturas electrónicas <span class="text-primary">rápido</span>,
            con control y apariencia profesional
          </h1>

          <p class="lead text-muted mb-4">
            Gestiona clientes, productos, impuestos y comprobantes desde una plataforma moderna.
            Ideal para equipos que buscan eficiencia, trazabilidad y una operación más ordenada.
          </p>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <a href="#planes" class="btn btn-primary btn-lg">
              <i class="fas fa-tags me-2"></i>Ver planes
            </a>
            <a href="#funcionalidades" class="btn btn-outline-secondary btn-lg">
              <i class="fas fa-circle-info me-2"></i>Conocer funcionalidades
            </a>
          </div>

          <div class="d-flex flex-wrap gap-3 small text-muted">
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-circle-check text-success"></i><span>Panel intuitivo</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-circle-check text-success"></i><span>Clientes + facturas</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-circle-check text-success"></i><span>Escalable por planes</span>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="hero-card card border-0 shadow-lg">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 class="mb-1">Resumen de facturación</h5>
                  <small class="text-muted">Vista de ejemplo del sistema</small>
                </div>
                <span class="badge text-bg-success">Online</span>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Facturas del mes</div>
                    <div class="fs-4 fw-bold">1,284</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Ingresos facturados</div>
                    <div class="fs-4 fw-bold">RD$2.4M</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Clientes activos</div>
                    <div class="fs-4 fw-bold">326</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Pendientes</div>
                    <div class="fs-4 fw-bold text-warning">24</div>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Factura</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>FAC-001245</td>
                      <td>Empresa Atlas SRL</td>
                      <td>RD$18,290</td>
                      <td><span class="badge text-bg-success">Generada</span></td>
                    </tr>
                    <tr>
                      <td>FAC-001246</td>
                      <td>Comercial Nova</td>
                      <td>RD$7,850</td>
                      <td><span class="badge text-bg-warning">Pendiente</span></td>
                    </tr>
                    <tr>
                      <td>FAC-001247</td>
                      <td>Servicios Delta</td>
                      <td>RD$32,400</td>
                      <td><span class="badge text-bg-info">En proceso</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-3 d-flex justify-content-between align-items-center">
                <small class="text-muted">Interfaz moderna, rápida y fácil de usar</small>
                <span class="text-primary fw-semibold">e-CF Ready</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>