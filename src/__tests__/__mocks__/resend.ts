// Manual mock for resend library
export const mockEmailsSend = jest.fn();

export const Resend = jest.fn().mockImplementation(() => ({
  emails: {
    send: mockEmailsSend
  }
}));