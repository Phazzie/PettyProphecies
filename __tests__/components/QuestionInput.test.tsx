import { render, screen, fireEvent } from "@testing-library/react"
import { QuestionInput } from "../../src/components/QuestionInput"
import { jest } from "@jest/globals"

describe("QuestionInput Component", () => {
  test("renders textarea element", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="" onChange={mockOnChange} />)

    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe("TEXTAREA")
  })

  test("displays character counter showing remaining characters (500 max)", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="Hello world" onChange={mockOnChange} />)

    const characterCount = screen.getByText(/characters remaining/i)
    expect(characterCount).toBeInTheDocument()

    // "Hello world" is 11 characters, so 500 - 11 = 489 remaining
    expect(screen.getByText(/489 characters remaining/i)).toBeInTheDocument()
  })

  test("character counter turns red when approaching limit (< 50 remaining)", () => {
    const mockOnChange = jest.fn()
    // 460 characters leaves 40 remaining (< 50)
    const longText = "a".repeat(460)
    const { container } = render(<QuestionInput value={longText} onChange={mockOnChange} />)

    const characterCount = screen.getByText(/40 characters remaining/i)
    expect(characterCount).toHaveClass("text-red-500")
  })

  test("character counter is not red when not approaching limit", () => {
    const mockOnChange = jest.fn()
    const shortText = "Short text"
    const { container } = render(<QuestionInput value={shortText} onChange={mockOnChange} />)

    const characterCount = screen.getByText(/characters remaining/i)
    expect(characterCount).toHaveClass("text-gray-500")
    expect(characterCount).not.toHaveClass("text-red-500")
  })

  test("value can be controlled via props", () => {
    const mockOnChange = jest.fn()
    const testValue = "What is my destiny?"
    render(<QuestionInput value={testValue} onChange={mockOnChange} />)

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    expect(textarea.value).toBe(testValue)
  })

  test("onChange callback fires when text changes", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="" onChange={mockOnChange} />)

    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: "New question text" } })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith("New question text")
  })

  test("maxLength is enforced on textarea", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="" onChange={mockOnChange} maxLength={500} />)

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    expect(textarea.maxLength).toBe(500)
  })

  test("custom maxLength can be set via props", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="" onChange={mockOnChange} maxLength={200} />)

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    expect(textarea.maxLength).toBe(200)

    const characterCount = screen.getByText(/200 characters remaining/i)
    expect(characterCount).toBeInTheDocument()
  })

  test("placeholder text displays", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="" onChange={mockOnChange} />)

    const textarea = screen.getByPlaceholderText(/ask the cards a question/i)
    expect(textarea).toBeInTheDocument()
  })

  test("custom placeholder can be set via props", () => {
    const mockOnChange = jest.fn()
    const customPlaceholder = "What guidance do you seek?"
    render(<QuestionInput value="" onChange={mockOnChange} placeholder={customPlaceholder} />)

    const textarea = screen.getByPlaceholderText(customPlaceholder)
    expect(textarea).toBeInTheDocument()
  })

  test("label is displayed", () => {
    const mockOnChange = jest.fn()
    render(<QuestionInput value="" onChange={mockOnChange} />)

    const label = screen.getByText(/your question.*optional/i)
    expect(label).toBeInTheDocument()
  })
})
