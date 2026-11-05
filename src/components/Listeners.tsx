"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  RefreshCw,
  MessageCircle,
  CheckCircle,
  PowerOff,
  X,
  Mail,
  Download,
} from "lucide-react";
import { Listener, FormErrors, Message, TimeSlot } from "../types/listener";
import {
  DAYS_OF_WEEK,
  DEFAULT_TIME_SLOTS,
  GENDERS,
} from "../constants/listener";
import {
  getAuthHeaders,
  handleUnauthorized,
  validateToken,
} from "../utils/api";
import { API_URL } from "@/config/api";
import {
  activateDeactivateListener,
  getListener,
  updateListener,
  createListener,
  deleteListener,
  inviteListener,
  updateListenerAvailability,
} from "../api/listener/api";
import { confirm } from "@/lib/confirm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageError } from "@/components/ui/page-error";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
} from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableCardSearch,
  tableControlClassName,
} from "@/components/ui/table-search";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { getListenerPerformance } from "@/api/admin/listeners/api";
import type { ListenerPerformanceRow } from "@/api/admin/listeners/types";

type PerfRangeDays = 30 | 90;

const formatRate = (rate: number | null | undefined, settled?: number) => {
  if (settled === 0 || rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
};

const rangeBounds = (days: PerfRangeDays) => {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
};

const Listeners: React.FC = (): JSX.Element => {
  useEffect(() => {
    const checkAuth = () => {
      if (!validateToken()) {
        return;
      }
      fetchListeners();
    };
    checkAuth();
  }, []);

  // State Management
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredListeners, setFilteredListeners] = useState<Listener[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [listenersPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListener, setSelectedListener] = useState<Listener | null>(
    null,
  );
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messagePriority, setMessagePriority] = useState<"normal" | "urgent">(
    "normal",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(
    new Set(DAYS_OF_WEEK),
  );

  // Sorting state
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Performance (settled rates in date window)
  const [perfRangeDays, setPerfRangeDays] = useState<PerfRangeDays>(90);
  const [performanceById, setPerformanceById] = useState<
    Record<string, ListenerPerformanceRow>
  >({});
  const [perfLoading, setPerfLoading] = useState(false);

  // Initialize new listener state
  const [newListener, setNewListener] = useState<Listener>({
    name: "",
    description: "",
    gender: "male",
    email: "",
    phoneNumber: "",
    availability: DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day,
      times:
        day === "saturday" || day === "sunday"
          ? DEFAULT_TIME_SLOTS.weekend.map((slot) => ({
              ...slot,
              isAvailable: true,
            }))
          : DEFAULT_TIME_SLOTS.weekday.map((slot) => ({
              ...slot,
              isAvailable: true,
            })),
    })),
  });

  // Add new state for activation status
  const [isActivating, setIsActivating] = useState(false);

  // Add new state for unavailable slot modal
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableSlotInfo, setUnavailableSlotInfo] = useState<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Add invite form state
  const [inviteForm, setInviteForm] = useState({ email: "" });

  // Fetch Listeners
  const fetchPerformance = async (days: PerfRangeDays = perfRangeDays) => {
    if (!validateToken()) return;
    try {
      setPerfLoading(true);
      const { from, to } = rangeBounds(days);
      const data = await getListenerPerformance({ from, to });
      const map: Record<string, ListenerPerformanceRow> = {};
      for (const row of data.listeners) {
        map[row.listenerId] = row;
      }
      setPerformanceById(map);
    } catch (err) {
      console.error("Error fetching listener performance:", err);
      setPerformanceById({});
    } finally {
      setPerfLoading(false);
    }
  };

  const fetchListeners = async () => {
    if (!validateToken()) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/listeners?sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.status === 401) {
        handleUnauthorized(response);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch listeners");
      }

      const listenersArray = Array.isArray(data) ? data : data.listeners || [];
      setListeners(listenersArray);
      setFilteredListeners(listenersArray);
      setError(null);
      void fetchPerformance(perfRangeDays);
    } catch (error) {
      console.error("Error fetching listeners:", error);
      setError("Failed to fetch listeners");
      setListeners([]);
      setFilteredListeners([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Listener Details
  const fetchListenerDetails = async (listenerId: string) => {
    if (!validateToken()) return;

    try {
      setIsLoading(true);
      const listener = await getListener(listenerId);
      setSelectedListener(listener);
      // setShowDetailsModal(true); // Removed as per edit hint
    } catch (error) {
      console.error("Error fetching listener details:", error);
      toast.error("Failed to fetch listener details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Messages for Listener
  const fetchMessagesForListener = async (listenerId?: string) => {
    if (!validateToken() || !listenerId) return;

    try {
      const response = await fetch(
        `${API_URL}/listeners/${listenerId}/messages`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch messages");
      }

      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages. Please try again.");
    }
  };

  // Send Message to Listener
  const sendMessageToListener = async () => {
    if (!validateToken() || !selectedListener) return;

    const confirmed = await confirm({
      title: "Send Message",
      description: `Send this message to ${selectedListener.name}?`,
      confirmText: "Send",
      variant: "default",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/listeners/${selectedListener._id}/messages`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            subject: messageSubject,
            content: messageContent,
            priority: messagePriority,
          }),
        },
      );

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      toast.success("Message sent successfully!");
      setMessageSubject("");
      setMessageContent("");
      setMessagePriority("normal");
      setShowMessageModal(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // Export Listeners
  const exportListeners = async () => {
    if (!validateToken()) return;

    try {
      const response = await fetch(`${API_URL}/listeners/export`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      if (!response.ok) {
        throw new Error("Failed to export listeners");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "listeners_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting listeners:", error);
      toast.error("Failed to export listeners. Please try again.");
    }
  };

  // Effect Hooks
  useEffect(() => {
    fetchListeners();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (!Array.isArray(listeners)) {
      setFilteredListeners([]);
      return;
    }

    const filtered = listeners.filter((listener) => {
      if (!listener) return false;
      const searchTermLower = searchTerm.toLowerCase();
      return listener.name?.toLowerCase()?.includes(searchTermLower) || false;
    });

    setFilteredListeners(filtered);
    setCurrentPage(1);
  }, [searchTerm, listeners]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    const hasInvalidTimes = newListener.availability.some((day) =>
      day.times.some((time) => !time.startTime || !time.endTime),
    );

    if (hasInvalidTimes) {
      errors.availability = "All time slots must have start and end times";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmitListener = async () => {
    if (!validateForm() || !selectedListener?._id) {
      return;
    }

    const confirmed = await confirm({
      title: "Update Availability",
      description: `Save availability changes for ${selectedListener.name}?`,
      confirmText: "Save",
      variant: "default",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await updateListenerAvailability(
        selectedListener._id,
        newListener.availability,
      );
      await fetchListeners();
      setShowModal(false);
      resetForm();
      toast.success("Availability updated successfully!");
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewListener((prev) => ({
      ...prev,
      availability: DAYS_OF_WEEK.map((day) => ({
        dayOfWeek: day,
        times: [], // Start with empty times for each day
      })),
    }));
    setAvailableDays(new Set(DAYS_OF_WEEK));
    setFormErrors({});
    setSelectedListener(null);
  };

  // Add this new function after the existing state declarations
  const toggleDayAvailability = (dayOfWeek: string) => {
    const newAvailableDays = new Set(availableDays);
    if (newAvailableDays.has(dayOfWeek)) {
      newAvailableDays.delete(dayOfWeek);
    } else {
      newAvailableDays.add(dayOfWeek);
    }
    setAvailableDays(newAvailableDays);

    // Update the newListener state to reflect the change
    setNewListener((prev) => ({
      ...prev,
      availability: prev.availability.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          return {
            ...day,
            times: newAvailableDays.has(dayOfWeek)
              ? [{ startTime: "09:00", endTime: "17:00", isAvailable: true }]
              : [],
          };
        }
        return day;
      }),
    }));
  };

  // Handle form input changes
  const handleInputChange = (field: keyof Listener, value: any) => {
    setNewListener((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update the handleTimeSlotChange function
  const handleTimeSlotChange = async (
    dayOfWeek: string,
    index: number,
    field: keyof TimeSlot,
    value: string,
  ) => {
    if (!selectedListener?._id) return;

    try {
      const updatedAvailability = newListener.availability.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          const newTimes = [...day.times];
          // Check if the time slot is unavailable
          if (newTimes[index].isAvailable === false) {
            setUnavailableSlotInfo({
              dayOfWeek,
              startTime: newTimes[index].startTime,
              endTime: newTimes[index].endTime,
            });
            setShowUnavailableModal(true);
            return day;
          }
          newTimes[index] = {
            ...newTimes[index],
            [field]: value,
            isAvailable: true,
          };
          return { ...day, times: newTimes };
        }
        return day;
      });

      // Update local state
      setNewListener((prev) => ({
        ...prev,
        availability: updatedAvailability,
      }));

      // Call the API to update availability
      await updateListenerAvailability(
        selectedListener._id,
        updatedAvailability,
      );
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability. Please try again.");
    }
  };

  // Update the removeTimeSlot function
  const removeTimeSlot = (dayOfWeek: string, index: number) => {
    setNewListener((prev) => ({
      ...prev,
      availability: prev.availability.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          // Check if the time slot is unavailable
          if (day.times[index].isAvailable === false) {
            setUnavailableSlotInfo({
              dayOfWeek,
              startTime: day.times[index].startTime,
              endTime: day.times[index].endTime,
            });
            setShowUnavailableModal(true);
            return day;
          }
          const newTimes = day.times.filter((_, i) => i !== index);
          return { ...day, times: newTimes };
        }
        return day;
      }),
    }));
  };

  // Add new time slot
  const addTimeSlot = (dayOfWeek: string) => {
    setNewListener((prev) => ({
      ...prev,
      availability: prev.availability.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          return {
            ...day,
            times: [
              ...day.times,
              {
                startTime: "09:00",
                endTime: "17:00",
                isAvailable: true,
              },
            ],
          };
        }
        return day;
      }),
    }));
  };

  // Handle edit click
  const handleEditClick = (listener: Listener) => {
    const availableDaysSet = new Set(
      listener.availability
        .filter((day) => day.times.length > 0)
        .map((day) => day.dayOfWeek),
    );

    setAvailableDays(availableDaysSet);
    setNewListener({
      _id: listener._id,
      name: listener.name || "",
      description: listener.description || "",
      gender: listener.gender || "male",
      email: listener.email || "",
      phoneNumber: listener.phoneNumber || "",
      availability: DAYS_OF_WEEK.map((day) => ({
        dayOfWeek: day,
        times:
          listener.availability.find((d) => d.dayOfWeek === day)?.times || [],
      })),
    });

    setSelectedListener(listener);
    setShowModal(true);
  };

  // Pagination
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const indexOfLastListener = currentPage * listenersPerPage;
  const indexOfFirstListener = indexOfLastListener - listenersPerPage;
  const currentListeners = Array.isArray(filteredListeners)
    ? filteredListeners.slice(indexOfFirstListener, indexOfLastListener)
    : [];

  // Refresh function
  const refreshListeners = () => {
    if (!validateToken()) return;
    fetchListeners();
  };

  // Add new function to handle activation/deactivation
  const handleActivationToggle = async (
    listenerId: string,
    currentStatus: boolean,
  ) => {
    if (!validateToken()) return;

    // Show confirmation dialog for both activation and deactivation
    const action = currentStatus ? "deactivate" : "activate";
    const confirmed = await confirm({
      title: `${currentStatus ? "Deactivate" : "Activate"} Listener`,
      description: currentStatus
        ? "Are you sure you want to deactivate this listener? This will prevent them from receiving new sessions."
        : "Are you sure you want to activate this listener? This will allow them to receive new sessions.",
      confirmText: currentStatus ? "Deactivate" : "Activate",
    });

    if (!confirmed) return;

    try {
      setIsActivating(true);
      await activateDeactivateListener(listenerId, { active: !currentStatus });
      await fetchListeners(); // Refresh the list
      toast.success(`Listener ${!currentStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      console.error("Error toggling listener status:", error);
      toast.error("Failed to update listener status. Please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  // Add delete handler
  const handleDeleteListener = async (listenerId: string) => {
    if (!validateToken()) return;

    const confirmed = await confirm({
      title: "Delete Listener",
      description:
        "Are you sure you want to delete this listener? This action cannot be undone.",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteListener(listenerId);
      await fetchListeners();
      toast.success("Listener deleted successfully!");
    } catch (error) {
      console.error("Error deleting listener:", error);
      toast.error("Failed to delete listener. Please try again.");
    }
  };

  // Add invite handler
  const handleInvite = async () => {
    if (!validateToken()) return;

    try {
      setIsSubmitting(true);
      await inviteListener(inviteForm);
      setShowInviteModal(false);
      setInviteForm({ email: "" });
      toast.success("Invitation sent successfully!");
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listeners"
        description="Manage listener profiles, availability, and invitations."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshListeners}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportListeners}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowInviteModal(true)}>
              <Mail className="mr-2 h-3.5 w-3.5" />
              Invite
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : error ? (
        <PageError message={error} onRetry={() => void fetchListeners()} />
      ) : (
        <TableCard
          title="All listeners"
          description={`${filteredListeners.length} profile${filteredListeners.length === 1 ? "" : "s"} · rates for last ${perfRangeDays} days${perfLoading ? " (updating…)" : ""}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-rs-border p-0.5">
                {([30, 90] as PerfRangeDays[]).map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      perfRangeDays === days
                        ? "bg-rs-text text-white"
                        : "text-rs-text-secondary hover:text-rs-text",
                    )}
                    onClick={() => {
                      setPerfRangeDays(days);
                      void fetchPerformance(days);
                    }}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <TableCardSearch
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                aria-label="Search listeners"
              />
            </div>
          }
          footer={
            <TablePagination
              page={currentPage}
              totalPages={Math.ceil(
                filteredListeners.length / listenersPerPage,
              )}
              total={filteredListeners.length}
              itemLabel="listeners"
              onPageChange={paginate}
            />
          }
        >
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  column="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Listener
                </SortableTableHead>
                <SortableTableHead
                  column="gender"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className="hidden md:table-cell"
                >
                  Gender
                </SortableTableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="hidden text-right tabular-nums lg:table-cell"
                  title="Settled sessions in range (excludes pending)"
                >
                  Sessions
                </TableHead>
                <TableHead
                  className="hidden text-right tabular-nums lg:table-cell"
                  title="Successful / settled"
                >
                  Completion
                </TableHead>
                <TableHead
                  className="hidden text-right tabular-nums lg:table-cell"
                  title="Cancelled / settled"
                >
                  Cancel
                </TableHead>
                <TableHead
                  className="hidden text-right tabular-nums xl:table-cell"
                  title="Unsuccessful / settled (no-show proxy)"
                >
                  Unsuccessful
                </TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentListeners.length > 0 ? (
                currentListeners.map((listener) => {
                  const id = listener._id;
                  const perf = id ? performanceById[id] : undefined;
                  return (
                  <TableRow key={id}>
                    <TableCell className="max-w-[18rem]">
                      <p className="truncate font-medium text-rs-text">
                        {listener.name}
                      </p>
                      <p className="truncate text-xs text-rs-text-muted">
                        {listener.email}
                      </p>
                      {listener.description ? (
                        <p
                          className="mt-0.5 line-clamp-1 text-xs text-rs-text-muted"
                          title={listener.description}
                        >
                          {listener.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden capitalize text-rs-text-secondary md:table-cell">
                      {listener.gender}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={statusToneFrom(
                          listener.active ? "active" : "inactive",
                        )}
                      >
                        {listener.active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-rs-text-secondary lg:table-cell">
                      {perf ? perf.settled : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-rs-text-secondary lg:table-cell">
                      {formatRate(perf?.completionRate, perf?.settled)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-rs-text-secondary lg:table-cell">
                      {formatRate(perf?.cancellationRate, perf?.settled)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-rs-text-secondary xl:table-cell">
                      {formatRate(perf?.unsuccessfulRate, perf?.settled)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rs-text-muted"
                          onClick={() => handleEditClick(listener)}
                          title="Edit availability"
                          aria-label="Edit availability"
                        >
                          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rs-text-muted"
                          onClick={() =>
                            handleActivationToggle(
                              listener._id!,
                              listener.active || false,
                            )
                          }
                          disabled={isActivating}
                          title={
                            listener.active
                              ? "Deactivate listener"
                              : "Activate listener"
                          }
                          aria-label={
                            listener.active
                              ? "Deactivate listener"
                              : "Activate listener"
                          }
                        >
                          {listener.active ? (
                            <PowerOff
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          ) : (
                            <CheckCircle
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rs-text-muted"
                          onClick={() => {
                            setSelectedListener(listener);
                            setShowMessageModal(true);
                          }}
                          title="Send message"
                          aria-label="Send message"
                        >
                          <MessageCircle
                            className="h-3.5 w-3.5"
                            strokeWidth={1.75}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableEmpty colSpan={8}>No listeners found</TableEmpty>
              )}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title="Update availability"
        description="Set weekly hours. Booked slots stay locked."
        className="max-w-xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitListener}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save availability"}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          {newListener.availability.map((day) => {
            const enabled = availableDays.has(day.dayOfWeek);
            return (
              <div
                key={day.dayOfWeek}
                className="rounded-lg border border-rs-border px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex min-w-0 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleDayAvailability(day.dayOfWeek)}
                      className="h-3.5 w-3.5 rounded border-rs-border text-rs-primary focus:ring-rs-primary"
                    />
                    <span className="text-sm font-medium capitalize text-rs-text">
                      {day.dayOfWeek}
                    </span>
                  </label>
                  {enabled ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-rs-text-secondary"
                      onClick={() => addTimeSlot(day.dayOfWeek)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add slot
                    </Button>
                  ) : null}
                </div>

                {enabled ? (
                  <div className="mt-2 space-y-1.5">
                    {day.times.map((time, timeIndex) => (
                      <div key={timeIndex} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time.startTime}
                          onChange={(e) =>
                            handleTimeSlotChange(
                              day.dayOfWeek,
                              timeIndex,
                              "startTime",
                              e.target.value,
                            )
                          }
                          disabled={!time.isAvailable}
                          className="h-8 flex-1 text-xs"
                        />
                        <span className="shrink-0 text-xs text-rs-text-muted">
                          to
                        </span>
                        <Input
                          type="time"
                          value={time.endTime}
                          onChange={(e) =>
                            handleTimeSlotChange(
                              day.dayOfWeek,
                              timeIndex,
                              "endTime",
                              e.target.value,
                            )
                          }
                          disabled={!time.isAvailable}
                          className="h-8 flex-1 text-xs"
                        />
                        <div className="flex w-20 shrink-0 items-center justify-end">
                          {!time.isAvailable ? (
                            <span title="Booked — cannot be modified">
                              <StatusBadge
                                tone="warning"
                                className="px-1.5 py-0"
                              >
                                Booked
                              </StatusBadge>
                            </span>
                          ) : day.times.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rs-text-muted"
                              onClick={() =>
                                removeTimeSlot(day.dayOfWeek, timeIndex)
                              }
                              aria-label="Remove time slot"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedListener && showMessageModal)}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedListener(null);
          setMessageSubject("");
          setMessageContent("");
          setMessagePriority("normal");
        }}
        title={`Message ${selectedListener?.name ?? ""}`}
        description="Send a note to this listener."
        className="max-w-xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMessageModal(false);
                setSelectedListener(null);
                setMessageSubject("");
                setMessageContent("");
                setMessagePriority("normal");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={sendMessageToListener}
              disabled={!messageSubject.trim() || !messageContent.trim()}
            >
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-rs-text-muted">
              Subject
            </span>
            <Input
              type="text"
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              placeholder="Subject"
              className="h-9 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-rs-text-muted">
              Message
            </span>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Write your message…"
              rows={5}
              className="w-full rounded-md border border-rs-border bg-rs-surface px-3 py-2 text-sm text-rs-text placeholder:text-rs-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-rs-text-muted">
              Priority
            </span>
            <select
              value={messagePriority}
              onChange={(e) =>
                setMessagePriority(e.target.value as "normal" | "urgent")
              }
              className={cn(tableControlClassName, "h-9 w-full text-sm")}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          {messages.length > 0 ? (
            <div className="space-y-2 border-t border-rs-border pt-3">
              <p className="text-xs font-medium text-rs-text-muted">
                Previous messages
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {messages.map((message: Message) => (
                  <div
                    key={message._id}
                    className="rounded-lg border border-rs-border px-3 py-2"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-rs-text">
                        {message.subject}
                      </p>
                      <StatusBadge
                        tone={
                          message.priority === "urgent" ? "warning" : "neutral"
                        }
                      >
                        {message.priority}
                      </StatusBadge>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-rs-text-secondary">
                      {message.content}
                    </p>
                    <p className="mt-1 text-[11px] text-rs-text-muted">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={showUnavailableModal && Boolean(unavailableSlotInfo)}
        onClose={() => {
          setShowUnavailableModal(false);
          setUnavailableSlotInfo(null);
        }}
        title="Time slot unavailable"
        description="This slot is booked and cannot be changed."
        footer={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setShowUnavailableModal(false);
              setUnavailableSlotInfo(null);
            }}
          >
            Got it
          </Button>
        }
      >
        {unavailableSlotInfo ? (
          <p className="text-sm text-rs-text-secondary">
            {unavailableSlotInfo.startTime}–{unavailableSlotInfo.endTime} on{" "}
            <span className="capitalize text-rs-text">
              {unavailableSlotInfo.dayOfWeek}
            </span>{" "}
            is locked to avoid conflicts with existing sessions.
          </p>
        ) : null}
      </Modal>

      <Modal
        open={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteForm({ email: "" });
        }}
        title="Invite listener"
        description="They’ll get an email with registration instructions."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowInviteModal(false);
                setInviteForm({ email: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInvite}
              disabled={isSubmitting || !inviteForm.email}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Send invite
                </>
              )}
            </Button>
          </>
        }
      >
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-rs-text-muted">
            Email
          </span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rs-text-muted" />
            <Input
              type="email"
              value={inviteForm.email}
              onChange={(e) =>
                setInviteForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="h-9 pl-8 text-sm"
              placeholder="listener@example.com"
            />
          </div>
        </label>
      </Modal>
    </div>
  );
};

export default Listeners;
