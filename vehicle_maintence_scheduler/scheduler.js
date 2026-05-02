const VALID_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

class MaintenanceScheduler {
  constructor() {
    this.jobs = new Map();
  }

  _generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  _getJob(id) {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    return job;
  }

  _guardStatus(job, ...allowed) {
    if (!allowed.includes(job.status)) {
      throw new Error(
        `Cannot perform this action. Job is "${job.status}", expected: ${allowed.join(' or ')}`
      );
    }
  }

  createJob(vehicleId, type, date) {
    if (!vehicleId) throw new Error('vehicleId is required');
    if (!type)      throw new Error('type is required');
    if (!date)      throw new Error('date is required');

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) throw new Error(`Invalid date: "${date}"`);

    const id  = this._generateId();
    const now = new Date();

    const job = {
      id,
      vehicleId,
      type,
      scheduledDate: parsedDate,
      status: 'scheduled',
      notes: null,
      createdAt: now,
      updatedAt: now
    };

    this.jobs.set(id, job);
    return { ...job };
  }

  startJob(id) {
    const job = this._getJob(id);
    this._guardStatus(job, 'scheduled');
    job.status    = 'in_progress';
    job.startedAt = new Date();
    job.updatedAt = new Date();
    return { ...job };
  }

  completeJob(id, notes = null) {
    const job = this._getJob(id);
    this._guardStatus(job, 'in_progress', 'scheduled');
    job.status      = 'completed';
    job.notes       = notes;
    job.completedAt = new Date();
    job.updatedAt   = new Date();
    return { ...job };
  }

  cancelJob(id, reason = null) {
    const job = this._getJob(id);
    this._guardStatus(job, 'scheduled', 'in_progress');
    job.status             = 'cancelled';
    job.cancellationReason = reason;
    job.cancelledAt        = new Date();
    job.updatedAt          = new Date();
    return { ...job };
  }

  rescheduleJob(id, newDate) {
    const job = this._getJob(id);
    this._guardStatus(job, 'scheduled');
    const parsed = new Date(newDate);
    if (isNaN(parsed.getTime())) throw new Error(`Invalid date: "${newDate}"`);
    job.scheduledDate  = parsed;
    job.rescheduledAt  = new Date();
    job.updatedAt      = new Date();
    return { ...job };
  }

  deleteJob(id) {
    const job = this._getJob(id);
    this._guardStatus(job, 'scheduled', 'cancelled');
    this.jobs.delete(id);
    return { deleted: true, id };
  }

  getById(id)          { return { ...this._getJob(id) }; }
  getAll()             { return Array.from(this.jobs.values()).map(j => ({ ...j })); }
  getByVehicle(vid)    { return this.getAll().filter(j => j.vehicleId === vid); }
  getByStatus(status)  {
    if (!VALID_STATUSES.includes(status)) throw new Error(`Invalid status: "${status}"`);
    return this.getAll().filter(j => j.status === status);
  }
  getOverdue() {
    const now = new Date();
    return this.getAll().filter(j => j.status === 'scheduled' && j.scheduledDate < now);
  }

  summary() {
    const all = this.getAll();
    const counts = VALID_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    for (const job of all) counts[job.status]++;
    return { total: all.length, overdue: this.getOverdue().length, ...counts };
  }
}

module.exports = MaintenanceScheduler;
