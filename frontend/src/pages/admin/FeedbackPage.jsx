import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiExternalLink, FiLoader, FiMessageSquare, FiSearch } from "react-icons/fi";
import { IoIosSend } from "react-icons/io";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { AdminPage, Button } from "../../components/admin/AdminUi";
import { StatusBadge } from "../../components/ui";
import reviewService from "../../services/reviewService";

const FeedbackPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyLoadingId, setReplyLoadingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewService.getAll();
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load feedback:", error);
      toast.error("Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return reviews;
    return reviews.filter((review) =>
      [
        review.customerName,
        review.username,
        review.comment,
        review.adminReply,
        String(review.productId || ""),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [reviews, searchTerm]);

  const handleReply = async (reviewId) => {
    const reply = replyDrafts[reviewId]?.trim();
    if (!reply) {
      toast.warning("Please enter a reply.");
      return;
    }

    setReplyLoadingId(reviewId);
    try {
      await reviewService.reply(reviewId, { reply });
      toast.success("Reply saved.");
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to save reply.");
    } finally {
      setReplyLoadingId(null);
    }
  };

  return (
    <AdminPage>
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900">FeedBack Management</h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Manage product reviews and admin replies
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-900">Product feedback</h3>
            <p className="mt-1 text-sm text-slate-500">{filteredReviews.length} review(s)</p>
          </div>
          <div className="relative w-full lg:w-[360px]">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search feedback..."
              className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-4 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:!border-black focus:!shadow-none focus:!ring-0 focus:bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Rating</th>
                <th className="w-[180px] max-w-[180px] px-6 py-4 text-sm font-semibold text-slate-700">Comment</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Reply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    <FiLoader className="mx-auto mb-3 h-7 w-7 animate-spin text-emerald-700" />
                    Loading feedback...
                  </td>
                </tr>
              ) : filteredReviews.length ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="align-top transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{review.customerName || review.username}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {review.createdAt ? new Date(review.createdAt).toLocaleString("vi-VN") : "---"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/products/${review.productId}`}
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        Product #{review.productId}
                        <FiExternalLink size={14} />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{review.rating}/5</span>
                    </td>
                    <td className="w-[180px] max-w-[180px] px-6 py-4">
                      <p className="break-words text-sm leading-6 text-slate-700">{review.comment}</p>
                    </td>
                    <td className="min-w-[320px] px-6 py-4">
                      {review.adminReply ? (
                        <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <StatusBadge tone="emerald" className="!bg-[#047857] !text-white !border-[#047857]">Replied</StatusBadge>
                            <span className="text-xs text-slate-500">{review.repliedBy || "Admin"}</span>
                          </div>
                          <p className="text-sm leading-6 text-emerald-900/80">{review.adminReply}</p>
                        </div>
                      ) : (
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          <FiMessageSquare size={14} />
                          Waiting reply
                        </div>
                      )}
                      <div className="relative flex items-center flex-1 rounded-2xl border !border-black bg-white focus-within:!border-black focus-within:!shadow-none focus-within:!ring-0 focus-within:!ring-transparent">
                        <textarea
                          rows={2}
                          value={replyDrafts[review.id] ?? review.adminReply ?? ""}
                          onChange={(event) =>
                            setReplyDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))
                          }
                          placeholder="Write admin reply..."
                          className="min-h-[44px] flex-1 resize-none bg-transparent pl-3 pr-10 py-2 text-sm text-slate-800 placeholder:text-slate-400/80 outline-none focus:!shadow-none focus:!ring-0 focus:!ring-transparent border-0 focus:border-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleReply(review.id)}
                          disabled={replyLoadingId === review.id}
                          className="absolute right-2 flex h-8 w-8 items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-30 transition-colors focus:outline-none focus:ring-0"
                          aria-label="Send reply"
                        >
                          {replyLoadingId === review.id ? (
                            <FiLoader className="h-4 w-4 animate-spin" />
                          ) : (
                            <IoIosSend size={20} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    No feedback found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
};

export default FeedbackPage;
