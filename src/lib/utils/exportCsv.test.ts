import { convertRegistrationsToCSV } from './exportCsv';
import { Registration } from '@/types';

describe('CSV Sanitization & Export', () => {
  it('sanitizes potential formula injection characters (=, +, -, @)', () => {
    const mockRegs: Registration[] = [
      {
        id: 'reg_100',
        eventId: 'evt_1',
        eventTitle: '=CMD|"/C calc"!A0',
        userId: 'u_1',
        nameSnapshot: '@MaliciousUser',
        emailSnapshot: 'hacker@study.iitm.ac.in',
        phoneSnapshot: '+91 9876543210',
        regionSnapshot: 'East',
        levelSnapshot: 'Diploma',
        programmeSnapshot: 'Data Science',
        registrationType: 'INDIVIDUAL',
        status: 'CONFIRMED',
        createdAt: '2026-08-14T00:00:00Z',
        updatedAt: '2026-08-14T00:00:00Z',
      },
    ];

    const csv = convertRegistrationsToCSV(mockRegs);
    expect(csv).toContain("\"'=CMD|\"\"/C calc\"\"!A0\"");
    expect(csv).toContain("\"'@MaliciousUser\"");
  });
});
