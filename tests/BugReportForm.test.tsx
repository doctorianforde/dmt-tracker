import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const submitBugReport = vi.fn();
vi.mock('@/lib/api-client', () => ({
  submitBugReport: (...args: unknown[]) => submitBugReport(...args),
}));

import BugReportForm from '@/components/BugReportForm';

function fillAndSend() {
  fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'Save is broken' } });
  fireEvent.change(screen.getByLabelText('What went wrong?'), { target: { value: 'Nothing happens' } });
  fireEvent.click(screen.getByText('Send report'));
}

describe('BugReportForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the issue number and where the confirmation went', async () => {
    submitBugReport.mockResolvedValue({ issueNumber: 'VIS-0042', confirmationSent: true });
    render(<BugReportForm email="jane@test.edu" />);
    fillAndSend();

    expect(await screen.findByText('Issue VIS-0042')).toBeInTheDocument();
    expect(screen.getByText('jane@test.edu')).toBeInTheDocument();
    expect(submitBugReport).toHaveBeenCalledWith({ summary: 'Save is broken', description: 'Nothing happens', steps: '' });
  });

  it('shows the error and keeps the form when sending fails', async () => {
    submitBugReport.mockRejectedValue(new Error('Please try again later.'));
    render(<BugReportForm email="jane@test.edu" />);
    fillAndSend();

    expect(await screen.findByText('Please try again later.')).toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toHaveValue('Save is broken');
  });
});
