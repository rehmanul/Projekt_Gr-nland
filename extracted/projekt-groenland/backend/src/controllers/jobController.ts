import { Request, Response } from 'express';
import { JobModel } from '../models/job';

export class JobController {
  static async list(req: Request, res: Response) {
    try {
      const jobs = await JobModel.findAll(req.tenantId!, req.query);
      res.json({ data: jobs, count: jobs.length });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const job = await JobModel.findById(
        parseInt(req.params.id),
        req.tenantId!
      );
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ data: job });
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const jobData = {
        ...req.body,
        tenant_id: req.tenantId,
        employer_id: req.user.employerId
      };

      const job = await JobModel.create(jobData);
      res.status(201).json({ data: job });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const job = await JobModel.update(
        parseInt(req.params.id),
        req.tenantId!,
        req.body
      );
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ data: job });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await JobModel.delete(parseInt(req.params.id), req.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  }
}
