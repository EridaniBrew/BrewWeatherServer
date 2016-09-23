Public Class Form1
    Private BW As BrewWeather

    Private Sub btnCheck_Click(sender As Object, e As EventArgs) Handles btnCheck.Click
        LogMsg(BW.Temperature.ToString())
        BW.Temperature = BW.Temperature - 5.3
    End Sub

    Private Sub Form1_Load(sender As Object, e As EventArgs) Handles Me.Load
        BW = New BrewWeather
        BW.Temperature = 100.0
    End Sub

    Private Sub LogMsg(s As String)
        txtLog.AppendText(vbCrLf & s)
    End Sub
End Class
