import * as React from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TicketList from "../components/TicketList";

const mockTickets = [
  {
    ticketId: "TICKET-123456",
    userMessage: "My order hasn't arrived yet.",
    aiResponse: "I see your order is shipped. [create_ticket]",
  },
  {
    ticketId: "TICKET-654321",
    userMessage: "Can I change my shipping address?",
    aiResponse: "Let me escalate this to our team. [create_ticket]",
  },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Header />
      <NavBar />
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Support Tickets</h1>
      <TicketList tickets={mockTickets} />
    </div>
  );
};

export default AdminDashboard;
